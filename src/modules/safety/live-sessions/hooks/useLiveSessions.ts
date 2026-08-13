import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { liveSessionsApi } from '../api';
import { toast } from 'sonner';
import { useSystemConfig } from '@/modules/system/config/hooks/useSystemConfig';
import { useMemo } from 'react';

export const useLiveSessions = () => {
  const queryClient = useQueryClient();
  const { config } = useSystemConfig();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['liveSessions'],
    queryFn: liveSessionsApi.getLiveSessions,
    refetchInterval: 10000 // Poll every 10s for live updates
  });

  const conflictingSessionIds = useMemo(() => {
    const ids = new Set<string>();
    if (!config?.booking?.overlappingSessionConflictDetection) return ids;

    const ongoing = sessions.filter(s => s.status === 'ONGOING');
    for (let i = 0; i < ongoing.length; i++) {
      for (let j = i + 1; j < ongoing.length; j++) {
        const s1 = ongoing[i];
        const s2 = ongoing[j];
        if (s1.companionId === s2.companionId) {
          const s1Start = new Date(s1.startTime).getTime();
          const s1End = new Date(s1.expectedEndTime).getTime();
          const s2Start = new Date(s2.startTime).getTime();
          const s2End = new Date(s2.expectedEndTime).getTime();

          if (s1Start < s2End && s1End > s2Start) {
            ids.add(s1.id);
            ids.add(s2.id);
          }
        }
      }
    }
    return ids;
  }, [sessions, config?.booking?.overlappingSessionConflictDetection]);

  const { mutate: resolveSOS } = useMutation({
    mutationFn: (id: string) => liveSessionsApi.resolveSOS(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveSessions'] });
      toast.success('SOS alert resolved');
    }
  });

  const { mutate: flagSession } = useMutation({
    mutationFn: (id: string) => liveSessionsApi.flagSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveSessions'] });
      toast.success('Session flagged to Safety Ops');
    }
  });

  return {
    sessions,
    isLoading,
    resolveSOS,
    flagSession,
    conflictingSessionIds
  };
};
