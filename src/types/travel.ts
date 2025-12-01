export type AppScreen = 'splash' | 'onboarding' | 'login' | 'home' | 'itinerary' | 'destinations' | 'budget' | 'gallery' | 'reports' | 'profile';

export type UserType = 'user' | null;

export type Destination = {
  id: number | string;
  name: string;
  location: string;
  category: string;
  image: string;
  visited: boolean;
  description: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
  isExternal?: boolean;
  externalSourceId?: string;
  externalSourcePlatform?: string;
  externalSourceUrl?: string;
  hashtags?: string[];
};

export type TripItineraryItem = {
  day: number;
  time: string;
  activity: string;
  location: string;
  budget?: number;
};

export type Trip = {
  id: number;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  dates?: string;
  image: string;
  budget: string;
  companions: number;
  status: 'upcoming' | 'completed';
  itinerary: TripItineraryItem[];
  createdAt: string;
  updatedAt: string;
  remainingBudget?: number;
  totalSpent?: number;
};

export type Photo = {
  id: number;
  destinationId: number | null;
  url: string;
  caption: string;
  rating: number;
  dateAdded: string;
  title: string;
  destinationName?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserSession = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePhoto?: string;
};

