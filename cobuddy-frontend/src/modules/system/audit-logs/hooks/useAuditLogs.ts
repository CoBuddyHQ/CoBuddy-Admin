import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from '../api';

export const useAuditLogs = () => {
  const query = useQuery({ queryKey: ['audit-logs'], queryFn: auditLogsApi.getLogs });

  return {
    logs: query.data || [],
    isLoading: query.isLoading,
  };
};
