'use client';

import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { isRouteReleased } from '@/lib/release';
import { useAuthStore } from '@/store/authStore';

const reports = [
  { path: '/analytics/financial', module: 'analytics-financial' },
  { path: '/analytics/operational', module: 'analytics-operational' },
  { path: '/analytics/growth', module: 'analytics-growth' },
  { path: '/analytics/safety', module: 'analytics-safety' },
];

export default function AnalyticsPage() {
  const user = useAuthStore((state) => state.user);
  if (!user) return <div role="status">Verifying your session...</div>;

  const report = reports.find(
    (item) => isRouteReleased(item.path) && hasPermission(user.roles, item.module),
  );
  if (report) redirect(report.path);

  return <p role="alert">No analytics reports are available for your account.</p>;
}
