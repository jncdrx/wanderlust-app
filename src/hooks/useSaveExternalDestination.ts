import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Destination } from '../types/travel';

export interface SaveExternalDestinationRequest {
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
}

export interface SaveExternalDestinationResponse {
  destination: Destination;
  isDuplicate: boolean;
  message: string;
}

export function useSaveExternalDestination() {
  return useMutation<SaveExternalDestinationResponse, Error, SaveExternalDestinationRequest>({
    mutationFn: async (request: SaveExternalDestinationRequest) => {
      return apiClient.saveExternalDestination(request);
    },
  });
}

