import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/auth/permissions';
import { useSosAlerts } from '@/modules/safety/sos-dashboard/hooks/useSosAlerts';
import { useTickets } from '@/modules/support/tickets/hooks/useTickets';
import { useSLA } from '@/modules/support/sla-dashboard/hooks/useSLA';
import { useVerificationQueue } from '@/modules/verification/hooks/useVerificationQueue';
import { StaffNotification } from '../types';

export const useStaffNotifications = () => {
  const { user } = useAuthStore();
  const userRoles = user?.roles || [];

  const { alerts: sosAlerts } = useSosAlerts();
  const { tickets } = useTickets();
  const { alerts: slaAlerts } = useSLA();
  const { cases: verificationCases } = useVerificationQueue();

  const notifications = useMemo(() => {
    if (!user) return [];
    const notifs: StaffNotification[] = [];

    // 1. SOS Alerts
    if (hasPermission(userRoles, 'sos-dashboard')) {
      const activeSOS = sosAlerts.filter(a => a.status === 'ACTIVE').length;
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
    if (hasPermission(userRoles, 'tickets')) {
      const assignedTickets = tickets.filter(t => t.assignedTo === user.name && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
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
    if (hasPermission(userRoles, 'sla-dashboard')) {
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
    if (hasPermission(userRoles, 'verification')) {
      const pendingVerifications = verificationCases.filter(c => c.status === 'PENDING_MANUAL_REVIEW').length;
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
  }, [user, userRoles, sosAlerts, tickets, slaAlerts, verificationCases]);

  return { notifications };
};
