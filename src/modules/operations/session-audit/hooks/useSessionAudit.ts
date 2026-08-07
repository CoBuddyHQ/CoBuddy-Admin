import { useQuery } from '@tanstack/react-query';
import { sessionAuditApi } from '../api';
import { SessionAuditFilters } from '../types';
import { useState } from 'react';

export const useSessionAudit = () => {
  const [filters, setFilters] = useState<SessionAuditFilters>({});

  const logsQuery = useQuery({
    queryKey: ['session-audit-logs', filters],
    queryFn: () => sessionAuditApi.getLogs(filters),
  });

  return {
    logs: logsQuery.data ?? [],
    isLoading: logsQuery.isLoading,
    filters,
    setFilters,
  };
};
