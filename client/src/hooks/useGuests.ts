import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGuests, getGuestsWithScores, createGuest, updateGuest, deleteGuest, clearAllGuests } from '../api';

export function useGuests(roomCode?: string) {
  return useQuery({
    queryKey: ['guests', roomCode],
    queryFn: () => getGuests(roomCode),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useGuestsWithScores(roomCode?: string) {
  return useQuery({
    queryKey: ['guestsWithScores', roomCode],
    queryFn: () => getGuestsWithScores(roomCode),
    staleTime: 10 * 1000, // 10 seconds
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, photo, predictions, rooms }: {
      name: string;
      photo?: string;
      predictions?: Record<string, number>;
      rooms?: string[];
    }) => createGuest(name, photo, predictions, rooms),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['guestsWithScores'] });
    }
  });
}

export function useUpdateGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ guestId, updates }: {
      guestId: number;
      updates: { name?: string; photo?: string; predictions?: Record<string, number>; rooms?: string[] };
    }) => updateGuest(guestId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['guestsWithScores'] });
    }
  });
}

export function useDeleteGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['guestsWithScores'] });
    }
  });
}

export function useClearAllGuests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearAllGuests,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['guestsWithScores'] });
    }
  });
}
