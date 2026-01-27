import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRooms, createRoom, deleteRoom } from '../api';

export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: getRooms,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, code }: { name: string; code: string }) => createRoom(name, code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    }
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    }
  });
}
