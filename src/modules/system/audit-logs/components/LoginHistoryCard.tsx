'use client';

import { useAuditLogs } from '@/modules/system/audit-logs/hooks/useAuditLogs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function LoginHistoryCard({ employeeId, title = "Login / Session History", description = "Recent login and logout activity." }: { employeeId: string, title?: string, description?: string }) {
  const { logs, isLoading: isLoadingLogs } = useAuditLogs();
  
  const loginHistory = logs.filter(l => l.adminId === employeeId && (l.action === 'LOGIN' || l.action === 'LOGOUT'));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingLogs ? (
          <div className="text-sm text-muted-foreground">Loading history...</div>
        ) : loginHistory.length === 0 ? (
          <div className="text-sm text-muted-foreground">No recent login history found.</div>
        ) : (
          <div className="space-y-4">
            {loginHistory.map(log => (
              <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between items-start gap-2 border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <div className="font-medium text-sm">
                    {log.action === 'LOGIN' ? 'Logged In' : 'Logged Out'}
                  </div>
                  <div className="text-xs text-muted-foreground">IP: {log.ipAddress}</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
