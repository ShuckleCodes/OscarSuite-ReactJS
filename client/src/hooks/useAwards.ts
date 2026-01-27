import { useQuery } from '@tanstack/react-query';
import { getAwards } from '../api';

export function useAwards() {
  return useQuery({
    queryKey: ['awards'],
    queryFn: getAwards,
    staleTime: 5 * 60 * 1000, // 5 minutes - awards don't change often
  });
}
