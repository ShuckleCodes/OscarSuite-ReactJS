import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAwards,
  createAward,
  updateAward,
  deleteAward,
  createNominee,
  updateNominee,
  deleteNominee
} from '../api';
import type { Nominee } from '../types';

export function useAwards() {
  return useQuery({
    queryKey: ['awards'],
    queryFn: getAwards,
    staleTime: 5 * 60 * 1000, // 5 minutes - awards don't change often
  });
}

export function useCreateAward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createAward(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['awards'] });
    }
  });
}

export function useUpdateAward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ awardId, updates }: { awardId: number; updates: { name?: string; nominees?: Nominee[] } }) =>
      updateAward(awardId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['awards'] });
    }
  });
}

export function useDeleteAward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (awardId: number) => deleteAward(awardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['awards'] });
    }
  });
}

export function useCreateNominee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ awardId, name, image, subHeading }: { awardId: number; name: string; image?: string; subHeading?: string }) =>
      createNominee(awardId, name, image, subHeading),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['awards'] });
    }
  });
}

export function useUpdateNominee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      awardId,
      nomineeId,
      updates
    }: {
      awardId: number;
      nomineeId: number;
      updates: { name?: string; image?: string; subHeading?: string };
    }) => updateNominee(awardId, nomineeId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['awards'] });
    }
  });
}

export function useDeleteNominee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ awardId, nomineeId }: { awardId: number; nomineeId: number }) =>
      deleteNominee(awardId, nomineeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['awards'] });
    }
  });
}
