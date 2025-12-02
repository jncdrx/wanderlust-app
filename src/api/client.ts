import type { Destination, Photo, Trip, TripItineraryItem, UserSession } from '../types/travel';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type RequestConfig = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
};

type AuthPayload = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

type TripCreatePayload = {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: string;
  companions: number;
  status?: Trip['status'];
  image?: string;
  itinerary?: Trip['itinerary'];
};

type PhotoCreatePayload = {
  destinationId: number | null;
  url: string;
  caption: string;
  rating: number;
  title?: string;
};

type DestinationCreatePayload = {
  name: string;
  location: string;
  category: string;
  description: string;
  image: string;
  rating: number;
};

type AuthResponse = {
  user: UserSession;
  accessToken: string;
  refreshToken: string;
};

export type UserSettings = {
  id: number;
  userId: string;
  emailNotifications: boolean;
  newsletter: boolean;
  tripUpdates: boolean;
  darkMode: boolean;
  language: string;
  timezone: string;
  dateFormat: string;
  mapView: string;
  autoBackup: boolean;
  createdAt: string;
  updatedAt: string;
};

const resolveApiBaseUrl = () => {
  // Check for explicit environment variable first
  const envBase =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    (typeof window !== 'undefined' && (window as typeof window & { __API_URL__?: string }).__API_URL__);

  if (envBase) {
    return envBase.endsWith('/') ? envBase.slice(0, -1) : envBase;
  }

  // If running in production (on Render or other hosting), use same origin
  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    
    // Detect production environments
    const isProduction = 
      currentOrigin.includes('.onrender.com') ||
      currentOrigin.includes('.vercel.app') ||
      currentOrigin.includes('.netlify.app') ||
      currentOrigin.includes('.railway.app') ||
      currentOrigin.includes('.fly.dev') ||
      !currentOrigin.includes('localhost') && !currentOrigin.includes('127.0.0.1');
    
    // If in production, use same origin (backend serves both API and frontend)
    if (isProduction) {
      return `${currentOrigin}/api`;
    }
    
    // If running on ngrok, use the same ngrok domain for backend
    const isNgrok = currentOrigin.includes('.ngrok-free.dev') || currentOrigin.includes('.ngrok.io');
    
    if (isNgrok) {
      // Use the same ngrok domain for backend (assuming backend is on same tunnel or separate ngrok)
      // If backend is on a separate ngrok tunnel, set VITE_API_URL environment variable
      return `${currentOrigin}/api`;
    }
  }

  // Default to localhost for local development
  return 'http://localhost:4001/api';
};

const API_BASE_URL = resolveApiBaseUrl();

const tokenKey = 'token';
const LAST_LOGIN_KEY = 'lastLoginTimestamp';

const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem(tokenKey);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Check if we recently logged in (within last 5 seconds)
const isRecentLogin = (): boolean => {
  if (typeof window === 'undefined') return false;
  const lastLogin = localStorage.getItem(LAST_LOGIN_KEY);
  if (!lastLogin) return false;
  const loginTime = parseInt(lastLogin, 10);
  const now = Date.now();
  return (now - loginTime) < 5000; // 5 seconds
};

const parseJson = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON response:', error, text);
    throw new Error('Received malformed response from server.');
  }
};

interface ApiErrorResponse {
  error: string;
  field?: string;
  maxLength?: number;
  currentLength?: number;
  details?: string;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await parseJson(response);
  if (!response.ok) {
    // Handle authentication errors (401/403) by clearing invalid tokens
    // But don't clear if we just logged in (might be a race condition)
    if (response.status === 401 || response.status === 403) {
      // Only clear tokens if it's not a recent login (to avoid clearing valid tokens after login)
      if (!isRecentLogin()) {
        if (typeof window !== 'undefined') {
          console.log('🔒 Clearing invalid authentication token');
          localStorage.removeItem(tokenKey);
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          // Dispatch custom event to notify SessionContext
          window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'invalid_token' } }));
        }
      } else {
        console.log('⚠️ Got 401/403 but ignoring (recent login, might be race condition)');
      }
    }
    
    // Handle structured error responses from backend
    if (data && typeof data === 'object' && 'error' in data) {
      const errorData = data as ApiErrorResponse & { remainingBudget?: number; totalBudget?: number; totalSpent?: number };
      const errorMessage = errorData.error || response.statusText || 'Request failed';
      
      // Create a more detailed error with field information
      const error = new Error(errorMessage) as Error & { 
        field?: string; 
        maxLength?: number; 
        currentLength?: number;
        remainingBudget?: number;
        totalBudget?: number;
        totalSpent?: number;
        status?: number;
      };
      error.status = response.status;
      if (errorData.field) error.field = errorData.field;
      if (errorData.maxLength !== undefined) error.maxLength = errorData.maxLength;
      if (errorData.currentLength !== undefined) error.currentLength = errorData.currentLength;
      if (errorData.remainingBudget !== undefined) error.remainingBudget = errorData.remainingBudget;
      if (errorData.totalBudget !== undefined) error.totalBudget = errorData.totalBudget;
      if (errorData.totalSpent !== undefined) error.totalSpent = errorData.totalSpent;
      
      throw error;
    }
    
    const errorMessage =
      (data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error) ||
      response.statusText ||
      'Request failed';
    const error = new Error(errorMessage) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return data as T;
};

const request = async <T>(endpoint: string, config: RequestConfig = {}): Promise<T> => {
  const { method = 'GET', body, headers = {}, auth = true } = config;

  const init: RequestInit = {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(auth ? getAuthHeaders() : {}),
      ...headers,
    },
  };

  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, init);
  return handleResponse<T>(response);
};

export const apiClient = {
  async register(userData: AuthPayload): Promise<AuthResponse> {
    // Server returns { user, token } but we expect { user, accessToken, refreshToken }
    const response = await request<{ user: UserSession; token: string; refreshToken?: string }>('/auth/register', {
      method: 'POST',
      body: userData,
      auth: false,
    });
    
    // Map server response to expected format
    const authResponse: AuthResponse = {
      user: response.user,
      accessToken: response.token,
      refreshToken: response.refreshToken || '',
    };
    
    // Store tokens
    if (typeof window !== 'undefined') {
      if (authResponse.accessToken) {
        localStorage.setItem(tokenKey, authResponse.accessToken);
        // Mark when we logged in to prevent clearing tokens too soon
        localStorage.setItem(LAST_LOGIN_KEY, Date.now().toString());
      }
      if (authResponse.refreshToken) localStorage.setItem('refreshToken', authResponse.refreshToken);
    }
    
    return authResponse;
  },

  async logout(): Promise<{ message: string }> {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refreshToken') 
      : null;
    
    try {
      await request<{ message: string }>('/auth/logout', {
        method: 'POST',
        body: refreshToken ? { refreshToken } : undefined,
        auth: false,
      });
    } catch (error) {
      // Continue with cleanup even if request fails
    } finally {
      // Clear tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem(tokenKey);
        localStorage.removeItem('refreshToken');
        localStorage.removeItem(LAST_LOGIN_KEY);
      }
    }
    
    return { message: 'Logged out successfully' };
  },

  async login(credentials: AuthPayload): Promise<AuthResponse> {
    // Server returns { user, token } but we expect { user, accessToken, refreshToken }
    const response = await request<{ user: UserSession; token: string; refreshToken?: string }>('/auth/login', {
      method: 'POST',
      body: credentials,
      auth: false,
    });
    
    // Map server response to expected format
    const authResponse: AuthResponse = {
      user: response.user,
      accessToken: response.token,
      refreshToken: response.refreshToken || '',
    };
    
    // Store tokens
    if (typeof window !== 'undefined') {
      if (authResponse.accessToken) {
        localStorage.setItem(tokenKey, authResponse.accessToken);
        // Mark when we logged in to prevent clearing tokens too soon
        localStorage.setItem(LAST_LOGIN_KEY, Date.now().toString());
      }
      if (authResponse.refreshToken) localStorage.setItem('refreshToken', authResponse.refreshToken);
    }
    
    return authResponse;
  },

  async fetchUserProfile(userId: string, token: string) {
    return request<UserSession>(`/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Update user profile
  async updateProfile(userId: string, profileData: { firstName?: string; lastName?: string; email?: string; profilePhoto?: string }): Promise<{ user: UserSession; message: string }> {
    return request<{ user: UserSession; message: string }>(`/users/${userId}/profile`, {
      method: 'PUT',
      body: profileData,
    });
  },

  // Change password
  async changePassword(userId: string, passwordData: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    return request<{ message: string }>(`/users/${userId}/password`, {
      method: 'PUT',
      body: passwordData,
    });
  },

  // Get user settings
  async getUserSettings(userId: string): Promise<UserSettings> {
    return request<UserSettings>(`/users/${userId}/settings`);
  },

  // Update user settings
  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<{ settings: UserSettings; message: string }> {
    // Filter out undefined values to prevent backend validation errors
    const filteredSettings = Object.fromEntries(
      Object.entries(settings).filter(([_, value]) => value !== undefined)
    );
    
    return request<{ settings: UserSettings; message: string }>(`/users/${userId}/settings`, {
      method: 'PUT',
      body: filteredSettings,
    });
  },

  // Send email verification
  async sendEmailVerification(userId: string, newEmail: string, currentPassword: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/users/${userId}/email/verify`, {
      method: 'POST',
      body: { newEmail, currentPassword },
    });
  },

  // Delete user account
  async deleteAccount(userId: string, password?: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/users/${userId}`, {
      method: 'DELETE',
      body: password ? { password } : undefined,
    });
  },

  async fetchDestinations(): Promise<Destination[]> {
    return request<Destination[]>('/destinations');
  },

  async uploadImage(file: File): Promise<{ url: string; filename: string; size: number; mimetype: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(data.error || 'Failed to upload image');
    }

    return response.json();
  },

  async createDestination(destinationData: DestinationCreatePayload): Promise<Destination> {
    return request<Destination>('/destinations', {
      method: 'POST',
      body: destinationData,
    });
  },

  async updateDestination(id: number, destinationData: Destination): Promise<Destination> {
    return request<Destination>(`/destinations/${id}`, {
      method: 'PUT',
      body: destinationData,
    });
  },

  async deleteDestination(id: number) {
    return request(`/destinations/${id}`, {
      method: 'DELETE',
    });
  },

  async fetchTrips(): Promise<Trip[]> {
    type ApiTripsResponse = { trips: Trip[] };
    const response = await request<ApiTripsResponse>('/trips');
    return response.trips;
  },

  async createTrip(tripData: TripCreatePayload): Promise<Trip> {
    type ApiTripResponse = { trip: Trip };
    const response = await request<ApiTripResponse>('/trips', {
      method: 'POST',
      body: tripData,
    });
    return response.trip;
  },

  async updateTrip(id: number, tripData: Trip): Promise<Trip> {
    return request<Trip>(`/trips/${id}`, {
      method: 'PUT',
      body: tripData,
    });
  },

  async addTripActivity(tripId: Trip['id'], activity: TripItineraryItem): Promise<Trip> {
    type ApiAddActivityResponse = { trip: Trip };
    const response = await request<ApiAddActivityResponse>(`/trips/${tripId}/activities`, {
      method: 'POST',
      body: {
        day: activity.day,
        time: activity.time,
        activity: activity.activity,
        location: activity.location,
        budget: activity.budget,
      },
    });
    return response.trip;
  },

  async deleteTrip(id: number) {
    return request(`/trips/${id}`, {
      method: 'DELETE',
    });
  },

  async fetchPhotos(): Promise<Photo[]> {
    return request<Photo[]>('/photos');
  },

  async createPhoto(photoData: PhotoCreatePayload): Promise<Photo> {
    return request<Photo>('/photos', {
      method: 'POST',
      body: photoData,
    });
  },

  async updatePhoto(id: number, photoData: Photo): Promise<Photo> {
    return request<Photo>(`/photos/${id}`, {
      method: 'PUT',
      body: photoData,
    });
  },

  async deletePhoto(id: number) {
    return request(`/photos/${id}`, {
      method: 'DELETE',
    });
  },

  async aiSearch(textQuery: string): Promise<{ searchMode: 'internal' | 'trending'; aiFilters: any; results: Destination[] }> {
    return request<{ searchMode: 'internal' | 'trending'; aiFilters: any; results: Destination[] }>('/ai-search', {
      method: 'POST',
      body: { textQuery },
    });
  },

  async saveExternalDestination(destinationData: {
    name: string;
    location: string;
    category: string;
    description?: string;
    image?: string;
    rating?: number;
    externalSourceId?: string;
    externalSourcePlatform?: string;
    externalSourceUrl?: string;
    hashtags?: string[];
  }): Promise<{ destination: Destination; isDuplicate: boolean; message: string }> {
    return request<{ destination: Destination; isDuplicate: boolean; message: string }>('/destinations/external', {
      method: 'POST',
      body: destinationData,
    });
  },

  async fetchSavedDestinations(): Promise<Destination[]> {
    return request<Destination[]>('/destinations/saved');
  },

  async fetchDestinationsWithFilters(aiFilters?: {
    category?: string;
    locationContains?: string;
    minRating?: number;
    tags?: string[];
  }): Promise<Destination[]> {
    // If no filters, use regular fetch
    if (!aiFilters || Object.keys(aiFilters).length === 0) {
      return this.fetchDestinations();
    }

    // Otherwise, use AI search endpoint
    // For now, we'll construct a text query from filters
    // In a more sophisticated implementation, you might want a separate filtered endpoint
    const textQuery = [
      aiFilters.category && `category: ${aiFilters.category}`,
      aiFilters.locationContains && `location: ${aiFilters.locationContains}`,
      aiFilters.minRating !== undefined && `rating >= ${aiFilters.minRating}`,
      aiFilters.tags && aiFilters.tags.length > 0 && `tags: ${aiFilters.tags.join(', ')}`,
    ]
      .filter(Boolean)
      .join(' ');

    const response = await this.aiSearch(textQuery);
    return response.results;
  },

  // Get reports and analytics
  async getReports(userId: string, timeframe: 'month' | 'year' | 'all' = 'year'): Promise<{
    insights: Array<{
      title: string;
      value: string;
      description: string;
      progress: number;
    }>;
    monthlyTrips: Array<{
      month: string;
      trips: number;
    }>;
    categoryData: Array<{
      name: string;
      count: number;
    }>;
    topDestinations: Array<{
      name: string;
      location: string;
      rating: number;
    }>;
    achievements: Array<{
      title: string;
      description: string;
      earned: boolean;
      progress: number;
      maxProgress: number;
    }>;
    summary: {
      totalTrips: number;
      uniqueLocations: number;
      photosCaptured: number;
      avgRating: string;
    };
  }> {
    return request(`/reports/${userId}?timeframe=${timeframe}`);
  },
};

