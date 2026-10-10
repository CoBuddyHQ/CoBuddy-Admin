import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/auth/permissions';
import { useSosAlerts } from '@/modules/safety/sos-dashboard/hooks/useSosAlerts';
import { useTickets } from '@/modules/support/tickets/hooks/useTickets';
import { useSLA } from '@/modules/support/sla-dashboard/hooks/useSLA';
import { useVerificationQueue } from '@/modules/verification/hooks/useVerificationQueue';
import { StaffNotification } from '../types';
import { isRouteReleased } from '@/lib/release';

export const useStaffNotifications = () => {
  const { user } = useAuthStore();
  const userRoles = user?.roles || [];

  const canSos = hasPermission(userRoles, 'sos-dashboard');
  const canTickets = isRouteReleased('/support/tickets') && hasPermission(userRoles, 'tickets');
  const canSla =
    isRouteReleased('/support/sla-dashboard') && hasPermission(userRoles, 'sla-dashboard');
  const canVerification = hasPermission(userRoles, 'verification');
  const { alerts: sosAlerts } = useSosAlerts(canSos);
  const { tickets } = useTickets(canTickets);
  const { alerts: slaAlerts } = useSLA(canSla);
  const { meta: verificationMeta } = useVerificationQueue({
    status: 'PENDING_MANUAL_REVIEW',
    pageSize: 1,
    enabled: canVerification,
  });

  const notifications = useMemo(() => {
    if (!user) return [];
    const notifs: StaffNotification[] = [];

    // 1. SOS Alerts
    if (canSos) {
      const activeSOS = sosAlerts.filter((a) => a.status === 'ACTIVE').length;
      if (activeSOS > 0) {
        notifs.push({
          id: 'sos-alert',
          title: 'SOS Alerts Active',
          description: `${activeSOS} active SOS alert(s) require immediate attention.`,
          href: '/safety/sos-dashboard',
          timestamp: new Date().toISOString(),
          type: 'sos',
        });
      }
    }

    // 2. Assigned Tickets
    if (canTickets) {
      const assignedTickets = tickets.filter(
        (t) => t.assignedTo === user.name && t.status !== 'RESOLVED' && t.status !== 'CLOSED',
      ).length;
      if (assignedTickets > 0) {
        notifs.push({
          id: 'ticket-assigned',
          title: 'Tickets Assigned',
          description: `You have ${assignedTickets} open ticket(s) assigned to you.`,
          href: '/support/tickets',
          timestamp: new Date().toISOString(),
          type: 'ticket',
        });
      }
    }

    // 3. SLA Breaches
    if (canSla) {
      const activeBreaches = slaAlerts.filter((a: any) => a.status === 'BREACHED').length;
      if (activeBreaches > 0) {
        notifs.push({
          id: 'sla-breach',
          title: 'SLA Breaches',
          description: `${activeBreaches} SLA breach(es) detected.`,
          href: '/support/sla-dashboard',
          timestamp: new Date().toISOString(),
          type: 'sla',
        });
      }
    }

    // 4. Verification Queue
    if (canVerification) {
      const pendingVerifications = verificationMeta?.totalItems ?? 0;
      if (pendingVerifications > 0) {
        notifs.push({
          id: 'verification-pending',
          title: 'Pending Verifications',
          description: `${pendingVerifications} verification(s) pending review.`,
          href: '/verification',
          timestamp: new Date().toISOString(),
          type: 'verification',
        });
      }
    }

    return notifs;
  }, [
    user,
    canSos,
    canTickets,
    canSla,
    canVerification,
    sosAlerts,
    tickets,
    slaAlerts,
    verificationMeta,
  ]);

  return { notifications };
};
