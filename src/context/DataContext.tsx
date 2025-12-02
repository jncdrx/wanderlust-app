import { createContext, useContext, useEffect, useMemo, useCallback, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { centeredToast } from '../components/CenteredToast';
import { apiClient } from '../api/client';
import type { Destination, Photo, Trip, TripItineraryItem } from '../types/travel';
import { useSession } from './SessionContext';

type CreateTripPayload = {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: string;
  companions: number;
  notes?: string;
  imageUrl: string;
};

type CreateDestinationPayload = {
  name: string;
  location: string;
  category: string;
  description: string;
  imageUrl: string;
  rating: number;
};

type CreatePhotoPayload = {
  destinationId: number | null;
  url: string;
  caption: string;
  rating: number;
};

type AISearchFilters = {
  category?: string;
  locationContains?: string;
  minRating?: number;
  tags?: string[];
};

type DataContextValue = {
  isLoading: boolean;
  trips: Trip[];
  destinations: Destination[];
  photos: Photo[];
  aiFilters: AISearchFilters | null;
  setAIFilters: (filters: AISearchFilters | null) => void;
  loadUserData: () => Promise<void>;
  refreshTrips: () => Promise<Trip[] | null>;
  addTrip: (payload: CreateTripPayload) => Promise<void>;
  updateTrip: (tripId: number, trip: Trip) => Promise<void>;
  addTripActivity: (tripId: Trip['id'], activity: TripItineraryItem) => Promise<Trip>;
  deleteTrip: (tripId: number) => Promise<void>;
  addDestination: (payload: CreateDestinationPayload) => Promise<void>;
  updateDestination: (destinationId: number, data: Destination) => Promise<void>;
  deleteDestination: (destinationId: number) => Promise<void>;
  addPhoto: (payload: CreatePhotoPayload) => Promise<void>;
  updatePhoto: (photoId: number, data: Photo) => Promise<void>;
  deletePhoto: (photoId: number) => Promise<void>;
};

const DataContext = createContext<DataContextValue | undefined>(undefined);

const MAX_IMAGE_LENGTH = 150000000; // ~100MB of base64 data

const getErrorMessage = (error: unknown, fallback = 'Unknown error') => {
  if (error instanceof Error) {
    // Check if error has additional field information
    const errorWithField = error as Error & { field?: string; maxLength?: number; currentLength?: number };
    if (errorWithField.field && errorWithField.maxLength !== undefined) {
      return `${error.message} (Field: ${errorWithField.field}, Limit: ${errorWithField.maxLength} characters)`;
    }
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
};

const ensureArrayResponse = <T,>(response: unknown, resource: string): T[] => {
  if (Array.isArray(response)) {
    return response as T[];
  }
  throw new Error(`Failed to load ${resource}`);
};

export function DataProvider({ children }: PropsWithChildren) {
  const { currentUser } = useSession();
  const queryClient = useQueryClient();
  const enabled = Boolean(currentUser);
  const [aiFilters, setAIFilters] = useState<AISearchFilters | null>(null);

  const {
    data: trips = [],
    isLoading: tripsLoading,
    refetch: refetchTripsQuery,
  } = useQuery<Trip[]>({
    queryKey: ['trips', currentUser?.id],
    queryFn: async () => ensureArrayResponse<Trip>(await apiClient.fetchTrips(), 'trips'),
    enabled,
    staleTime: 1000, // Data is fresh for 1 second
    refetchInterval: enabled ? 3000 : false, // Refetch every 3 seconds for real-time feel
    refetchOnWindowFocus: true, // Refetch when user returns to app
    refetchOnMount: true,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors (401/403)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status?: number }).status;
        if (status === 401 || status === 403) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });

  const {
    data: destinations = [],
    isLoading: destinationsLoading,
    refetch: refetchDestinationsQuery,
  } = useQuery<Destination[]>({
    queryKey: ['destinations', currentUser?.id, aiFilters],
    queryFn: async () => {
      if (aiFilters && Object.keys(aiFilters).length > 0) {
        return ensureArrayResponse<Destination>(
          await apiClient.fetchDestinationsWithFilters(aiFilters),
          'destinations'
        );
      }
      return ensureArrayResponse<Destination>(await apiClient.fetchDestinations(), 'destinations');
    },
    enabled,
    staleTime: 1000,
    refetchInterval: enabled ? 3000 : false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors (401/403)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status?: number }).status;
        if (status === 401 || status === 403) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });

  const {
    data: photos = [],
    isLoading: photosLoading,
    refetch: refetchPhotosQuery,
  } = useQuery<Photo[]>({
    queryKey: ['photos', currentUser?.id],
    queryFn: async () => ensureArrayResponse<Photo>(await apiClient.fetchPhotos(), 'photos'),
    enabled,
    staleTime: 1000,
    refetchInterval: enabled ? 3000 : false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors (401/403)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status?: number }).status;
        if (status === 401 || status === 403) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });

  useEffect(() => {
    if (!currentUser) {
      queryClient.removeQueries({ queryKey: ['trips'] });
      queryClient.removeQueries({ queryKey: ['destinations'] });
      queryClient.removeQueries({ queryKey: ['photos'] });
    }
  }, [currentUser, queryClient]);

  const loadUserData = useCallback(async () => {
    if (!currentUser) {
      console.log('❌ No current user, skipping data load');
      return;
    }

    await Promise.all([
      refetchTripsQuery(),
      refetchDestinationsQuery(),
      refetchPhotosQuery(),
    ]);
  }, [currentUser, refetchTripsQuery, refetchDestinationsQuery, refetchPhotosQuery]);

  const refreshTrips = useCallback(async (): Promise<Trip[] | null> => {
    if (!currentUser) {
      console.warn('⚠️ Tried to refresh trips without a user session');
      return null;
    }
    const result = await refetchTripsQuery();
    return result.data ?? null;
  }, [currentUser, refetchTripsQuery]);

  const createTripMutation = useMutation({
    mutationFn: async (newItinerary: CreateTripPayload) => {
      const sanitizedTitle = newItinerary.title.trim();
      const sanitizedDestination = newItinerary.destination.trim();
      const sanitizedBudget = newItinerary.budget.trim();
      const sanitizedImage = newItinerary.imageUrl?.trim() || '';

      if (sanitizedImage && sanitizedImage.length > MAX_IMAGE_LENGTH) {
        throw new Error('Image is too large. Please choose a smaller image.');
      }

      const tripData = {
        title: sanitizedTitle,
        destination: sanitizedDestination,
        startDate: newItinerary.startDate,
        endDate: newItinerary.endDate,
        budget: sanitizedBudget,
        companions: newItinerary.companions,
        status: 'upcoming' as const,
        image: sanitizedImage,
        itinerary: [],
      };

      return apiClient.createTrip(tripData);
    },
    onMutate: async (newItinerary) => {
      // Cancel outgoing refetches for optimistic update
      await queryClient.cancelQueries({ queryKey: ['trips', currentUser?.id] });
      const previousTrips = queryClient.getQueryData<Trip[]>(['trips', currentUser?.id]);
      
      // Optimistically add the new trip
      const optimisticTrip: Trip = {
        id: Date.now(), // Temporary ID
        title: newItinerary.title.trim(),
        destination: newItinerary.destination.trim(),
        startDate: newItinerary.startDate,
        endDate: newItinerary.endDate,
        budget: newItinerary.budget.trim() || '₱0',
        companions: newItinerary.companions,
        status: 'upcoming',
        image: newItinerary.imageUrl || '',
        itinerary: [],
        userId: currentUser?.id || 0,
      };
      
      queryClient.setQueryData<Trip[]>(['trips', currentUser?.id], (old) => 
        old ? [optimisticTrip, ...old] : [optimisticTrip]
      );
      
      return { previousTrips };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      centeredToast.success('Trip created successfully!', {
        description: `${variables.title.trim() || 'Trip'} has been added to your itinerary.`,
      });
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousTrips) {
        queryClient.setQueryData(['trips', currentUser?.id], context.previousTrips);
      }
      centeredToast.error(`Failed to create trip: ${getErrorMessage(error)}`);
    },
  });

  const updateTripMutation = useMutation({
    mutationFn: async ({ tripId, trip }: { tripId: number; trip: Trip }) =>
      apiClient.updateTrip(tripId, trip),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      centeredToast.success('Trip updated successfully!');
    },
    onError: (error) => {
      centeredToast.error(`Failed to update trip: ${getErrorMessage(error)}`);
    },
  });

  const addTripActivityMutation = useMutation({
    mutationFn: async ({ tripId, activity }: { tripId: Trip['id']; activity: TripItineraryItem }) =>
      apiClient.addTripActivity(tripId, activity),
    onMutate: async ({ tripId, activity }) => {
      await queryClient.cancelQueries({ queryKey: ['trips', currentUser?.id] });
      const previousTrips = queryClient.getQueryData<Trip[]>(['trips', currentUser?.id]);

      if (previousTrips) {
        const optimisticTrips = previousTrips.map((trip) =>
          trip.id === tripId
            ? { ...trip, itinerary: [...(trip.itinerary || []), activity] }
            : trip
        );
        queryClient.setQueryData(['trips', currentUser?.id], optimisticTrips);
      }

      return { previousTrips };
    },
    onSuccess: (updatedTrip) => {
      queryClient.setQueryData<Trip[] | undefined>(['trips', currentUser?.id], (old) =>
        old ? old.map((trip) => (trip.id === updatedTrip.id ? updatedTrip : trip)) : old
      );
      centeredToast.success('Activity added to itinerary!');
    },
    onError: (error, _variables, context) => {
      if (context?.previousTrips) {
        queryClient.setQueryData(['trips', currentUser?.id], context.previousTrips);
      }
      centeredToast.error(`Failed to add activity: ${getErrorMessage(error)}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', currentUser?.id] });
    },
  });

  const deleteTripMutation = useMutation({
    mutationFn: (tripId: number) => apiClient.deleteTrip(tripId),
    onMutate: async (tripId) => {
      await queryClient.cancelQueries({ queryKey: ['trips', currentUser?.id] });
      const previousTrips = queryClient.getQueryData<Trip[]>(['trips', currentUser?.id]);
      
      // Optimistically remove the trip
      queryClient.setQueryData<Trip[]>(['trips', currentUser?.id], (old) => 
        old ? old.filter(trip => trip.id !== tripId) : []
      );
      
      return { previousTrips };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      centeredToast.success('Trip deleted successfully!');
    },
    onError: (error, _, context) => {
      if (context?.previousTrips) {
        queryClient.setQueryData(['trips', currentUser?.id], context.previousTrips);
      }
      centeredToast.error(`Failed to delete trip: ${getErrorMessage(error)}`);
    },
  });

  const createDestinationMutation = useMutation({
    mutationFn: async (newDestination: CreateDestinationPayload) => {
      const destinationData = {
        name: newDestination.name,
        location: newDestination.location,
        category: newDestination.category,
        description: newDestination.description,
        image: newDestination.imageUrl,
        rating: newDestination.rating,
      };

      return apiClient.createDestination(destinationData);
    },
    onMutate: async (newDestination) => {
      await queryClient.cancelQueries({ queryKey: ['destinations', currentUser?.id] });
      const previousDestinations = queryClient.getQueryData<Destination[]>(['destinations', currentUser?.id]);
      
      // Optimistically add the new destination
      const optimisticDestination: Destination = {
        id: Date.now(),
        name: newDestination.name,
        location: newDestination.location,
        category: newDestination.category,
        description: newDestination.description,
        image: newDestination.imageUrl,
        rating: newDestination.rating,
        visited: false,
        userId: currentUser?.id || 0,
      };
      
      queryClient.setQueryData<Destination[]>(['destinations', currentUser?.id], (old) => 
        old ? [optimisticDestination, ...old] : [optimisticDestination]
      );
      
      return { previousDestinations };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      centeredToast.success('Destination added successfully!', {
        description: `${variables.name} has been added to your destinations.`,
      });
    },
    onError: (error, _, context) => {
      if (context?.previousDestinations) {
        queryClient.setQueryData(['destinations', currentUser?.id], context.previousDestinations);
      }
      const errorMessage = getErrorMessage(error);
      const errorWithField = error as Error & { field?: string; maxLength?: number; currentLength?: number };
      
      if (errorWithField.field) {
        centeredToast.error(`Failed to add destination`, {
          description: errorMessage,
          duration: 5000,
        });
      } else {
        centeredToast.error(`Failed to add destination: ${errorMessage}`);
      }
    },
  });

  const updateDestinationMutation = useMutation({
    mutationFn: async ({ destinationId, destination }: { destinationId: number; destination: Destination }) =>
      apiClient.updateDestination(destinationId, destination),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      centeredToast.success('Destination updated successfully!');
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      const errorWithField = error as Error & { field?: string; maxLength?: number; currentLength?: number };
      
      if (errorWithField.field) {
        centeredToast.error(`Failed to update destination`, {
          description: errorMessage,
          duration: 5000,
        });
      } else {
        centeredToast.error(`Failed to update destination: ${errorMessage}`);
      }
    },
  });

  const deleteDestinationMutation = useMutation({
    mutationFn: (destinationId: number) => apiClient.deleteDestination(destinationId),
    onMutate: async (destinationId) => {
      await queryClient.cancelQueries({ queryKey: ['destinations', currentUser?.id] });
      const previousDestinations = queryClient.getQueryData<Destination[]>(['destinations', currentUser?.id]);
      
      // Optimistically remove the destination
      queryClient.setQueryData<Destination[]>(['destinations', currentUser?.id], (old) => 
        old ? old.filter(dest => dest.id !== destinationId) : []
      );
      
      return { previousDestinations };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      centeredToast.success('Destination deleted successfully!');
    },
    onError: (error, _, context) => {
      if (context?.previousDestinations) {
        queryClient.setQueryData(['destinations', currentUser?.id], context.previousDestinations);
      }
      centeredToast.error(`Failed to delete destination: ${getErrorMessage(error)}`);
    },
  });

  const createPhotoMutation = useMutation({
    mutationFn: async (newPhoto: CreatePhotoPayload) => {
      const sanitizedCaption = newPhoto.caption?.trim() || '';
      const sanitizedUrl = newPhoto.url?.trim() || '';
      const normalizedRating = Math.min(5, Math.max(1, Math.round(Number(newPhoto.rating) || 0)));
      const destinationId =
        newPhoto.destinationId === null || newPhoto.destinationId === undefined
          ? null
          : Number.isFinite(newPhoto.destinationId)
            ? newPhoto.destinationId
            : null;

      if (!sanitizedUrl || !sanitizedCaption) {
        throw new Error('Please provide both a photo and a caption.');
      }

      const photoData = {
        destinationId,
        url: sanitizedUrl,
        caption: sanitizedCaption,
        rating: normalizedRating,
        title: sanitizedCaption || 'Untitled Photo',
      };

      return apiClient.createPhoto(photoData);
    },
    onMutate: async (newPhoto) => {
      await queryClient.cancelQueries({ queryKey: ['photos', currentUser?.id] });
      const previousPhotos = queryClient.getQueryData<Photo[]>(['photos', currentUser?.id]);
      
      // Optimistically add the new photo
      const optimisticPhoto: Photo = {
        id: Date.now(),
        destinationId: newPhoto.destinationId,
        url: newPhoto.url,
        caption: newPhoto.caption,
        rating: newPhoto.rating,
        title: newPhoto.caption || 'Untitled Photo',
        userId: currentUser?.id || 0,
        createdAt: new Date().toISOString(),
      };
      
      queryClient.setQueryData<Photo[]>(['photos', currentUser?.id], (old) => 
        old ? [optimisticPhoto, ...old] : [optimisticPhoto]
      );
      
      return { previousPhotos };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      centeredToast.success('Photo added successfully!', {
        description: 'Your photo has been added to the gallery.',
      });
    },
    onError: (error, _, context) => {
      if (context?.previousPhotos) {
        queryClient.setQueryData(['photos', currentUser?.id], context.previousPhotos);
      }
      centeredToast.error(`Failed to add photo: ${getErrorMessage(error)}`);
    },
  });

  const updatePhotoMutation = useMutation({
    mutationFn: async ({ photoId, photo }: { photoId: number; photo: Photo }) =>
      apiClient.updatePhoto(photoId, photo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      centeredToast.success('Photo updated successfully!');
    },
    onError: (error) => {
      centeredToast.error(`Failed to update photo: ${getErrorMessage(error)}`);
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: number) => apiClient.deletePhoto(photoId),
    onMutate: async (photoId) => {
      await queryClient.cancelQueries({ queryKey: ['photos', currentUser?.id] });
      const previousPhotos = queryClient.getQueryData<Photo[]>(['photos', currentUser?.id]);
      
      // Optimistically remove the photo
      queryClient.setQueryData<Photo[]>(['photos', currentUser?.id], (old) => 
        old ? old.filter(photo => photo.id !== photoId) : []
      );
      
      return { previousPhotos };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      centeredToast.success('Photo deleted successfully!');
    },
    onError: (error, _, context) => {
      if (context?.previousPhotos) {
        queryClient.setQueryData(['photos', currentUser?.id], context.previousPhotos);
      }
      centeredToast.error(`Failed to delete photo: ${getErrorMessage(error)}`);
    },
  });

  const addTrip = (payload: CreateTripPayload) => createTripMutation.mutateAsync(payload);
  const updateTrip = (tripId: number, trip: Trip) => updateTripMutation.mutateAsync({ tripId, trip });
  const addTripActivity = (tripId: Trip['id'], activity: TripItineraryItem) =>
    addTripActivityMutation.mutateAsync({ tripId, activity });
  const deleteTrip = (tripId: number) => deleteTripMutation.mutateAsync(tripId);
  const addDestination = (payload: CreateDestinationPayload) => createDestinationMutation.mutateAsync(payload);
  const updateDestination = (destinationId: number, data: Destination) =>
    updateDestinationMutation.mutateAsync({ destinationId, destination: data });
  const deleteDestination = (destinationId: number) => deleteDestinationMutation.mutateAsync(destinationId);
  const addPhoto = (payload: CreatePhotoPayload) => createPhotoMutation.mutateAsync(payload);
  const updatePhoto = (photoId: number, photo: Photo) => updatePhotoMutation.mutateAsync({ photoId, photo });
  const deletePhoto = (photoId: number) => deletePhotoMutation.mutateAsync(photoId);

  const isLoading = tripsLoading || destinationsLoading || photosLoading;

  const value = useMemo<DataContextValue>(() => ({
    isLoading,
    trips,
    destinations,
    photos,
    aiFilters,
    setAIFilters,
    loadUserData,
    refreshTrips,
    addTrip,
    updateTrip,
    addTripActivity,
    deleteTrip,
    addDestination,
    updateDestination,
    deleteDestination,
    addPhoto,
    updatePhoto,
    deletePhoto,
  }), [
    isLoading,
    trips,
    destinations,
    photos,
    aiFilters,
    setAIFilters,
    loadUserData,
    refreshTrips,
    addTrip,
    updateTrip,
    deleteTrip,
    addTripActivity,
    addDestination,
    updateDestination,
    deleteDestination,
    addPhoto,
    updatePhoto,
    deletePhoto,
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

/**
 * Hook to access travel data context.
 * 
 * @throws {Error} If used outside of DataProvider
 * @returns {DataContextValue} The travel data context value
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { trips, destinations, addTrip } = useTravelData();
 *   // Use the context...
 * }
 * ```
 * 
 * Make sure your component is wrapped in DataProvider:
 * ```tsx
 * <DataProvider>
 *   <MyComponent />
 * </DataProvider>
 * ```
 */
export const useTravelData = () => {
  const context = useContext(DataContext);
  if (!context) {
    const errorMessage = 
      'useTravelData must be used within a DataProvider.\n' +
      'Make sure your component tree includes:\n' +
      '  <SessionProvider>\n' +
      '    <QueryClientProvider>\n' +
      '      <DataProvider>\n' +
      '        <YourComponent /> // useTravelData can be used here\n' +
      '      </DataProvider>\n' +
      '    </QueryClientProvider>\n' +
      '  </SessionProvider>';
    
    throw new Error(errorMessage);
  }
  return context;
};

