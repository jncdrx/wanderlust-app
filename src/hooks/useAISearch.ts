/**
 * AI Search Hook
 * Custom hook for AI-powered destination search using TanStack Query
 */

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Destination } from '../types/travel';

/**
 * TypeScript interface for AI search filters
 */
export interface AISearchFilters {
  category?: string;
  locationContains?: string;
  minRating?: number;
  tags?: string[];
}

/**
 * TypeScript interface for AI search response
 */
export interface AISearchResponse {
  searchMode: 'internal' | 'trending';
  aiFilters: AISearchFilters | null;
  results: Destination[];
}

/**
 * TypeScript interface for AI search request
 */
export interface AISearchRequest {
  textQuery: string;
}

/**
 * Custom hook for AI-powered destination search
 * 
 * @returns Mutation object for performing AI search
 * 
 * @example
 * ```tsx
 * const aiSearchMutation = useAISearchMutation();
 * 
 * const handleSearch = () => {
 *   aiSearchMutation.mutate(
 *     { textQuery: 'Find museums in Paris' },
 *     {
 *       onSuccess: (data) => {
 *         console.log('AI Filters:', data.aiFilters);
 *         console.log('Results:', data.results);
 *       }
 *     }
 *   );
 * };
 * ```
 */
export function useAISearchMutation() {
  return useMutation<AISearchResponse, Error, AISearchRequest>({
    mutationFn: async (request: AISearchRequest) => {
      if (!request.textQuery || !request.textQuery.trim()) {
        throw new Error('textQuery is required and must be a non-empty string');
      }
      return apiClient.aiSearch(request.textQuery);
    },
  });
}

