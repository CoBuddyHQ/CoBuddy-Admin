import { useQuery } from '@tanstack/react-query';
import { activeSessionsApi } from '../api';

export const useActiveSessions = () => {
  const query = useQuery({ queryKey: ['active-sessions'], queryFn: activeSessionsApi.getSessions, refetchInterval: 2000 });

  return {
    sessions: query.data || [],
    isLoading: query.isLoading,
  };
};
