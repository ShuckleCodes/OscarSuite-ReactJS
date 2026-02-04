import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAppState, setPredictionsLocked, setWinner, clearWinner, resetAppState, setEventTitle } from '../api';

export function useAppState() {
  return useQuery({
    queryKey: ['appState'],
    queryFn: getAppState,
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 5 * 1000, // Poll every 5 seconds
  });
}

export function useSetPredictionsLocked() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setPredictionsLocked,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appState'] });
    }
  });
}

export function useSetWinner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ awardId, nomineeId }: { awardId: number; nomineeId: number }) =>
      setWinner(awardId, nomineeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appState'] });
      queryClient.invalidateQueries({ queryKey: ['guestsWithScores'] });
    }
  });
}

export function useClearWinner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearWinner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appState'] });
      queryClient.invalidateQueries({ queryKey: ['guestsWithScores'] });
    }
  });
}

export function useResetAppState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetAppState,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appState'] });
      queryClient.invalidateQueries({ queryKey: ['guestsWithScores'] });
    }
  });
}

export function useSetEventTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setEventTitle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appState'] });
    }
  });
}
