'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  Headphones,
  MapPin,
  Phone,
  RefreshCw,
  ShieldAlert,
  Siren,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { hasPermission } from '@/lib/auth/permissions';
import { useAuthStore } from '@/store/authStore';
import { useSosAlerts } from '@/modules/safety/sos-dashboard/hooks/useSosAlerts';
import { SosGoogleMap } from '@/modules/safety/sos-dashboard/components/SosGoogleMap';
import { getSosPosition, SOS_STATUS_LABELS } from '@/modules/safety/sos-dashboard/location';

export default function SosDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const permitted = hasPermission(user?.roles ?? [], 'sos-dashboard');
  const {
    alerts,
    isLoading,
    isError,
    isFetching,
    dataUpdatedAt,
    refetch,
    updateStatus,
    isUpdating,
  } = useSosAlerts(permitted);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contactId, setContactId] = useState<string | null>(null);
  const [audioId, setAudioId] = useState<string | null>(null);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const mapSection = useRef<HTMLDivElement>(null);
  const activeAlerts = useMemo(
    () => alerts.filter((alert) => alert.status !== 'RESOLVED'),
    [alerts],
  );
  const selected = activeAlerts.find((alert) => alert.id === selectedId);
  const contact = activeAlerts.find((alert) => alert.id === contactId);
  const audio = activeAlerts.find((alert) => alert.id === audioId);
  const resolving = activeAlerts.find((alert) => alert.id === resolveId);
  const phone = contact?.phone.replace(/[^\d+]/g, '');

  if (!permitted) return <p role="alert">You do not have access to SOS alerts.</p>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Live SOS Dashboard"
        action={
          <div className="flex flex-wrap items-center gap-3">
            {dataUpdatedAt > 0 && (
              <span className="text-xs text-muted-foreground">
                Last received {new Date(dataUpdatedAt).toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="icon"
              title="Refresh SOS alerts"
              aria-label="Refresh SOS alerts"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              <RefreshCw className={isFetching ? 'animate-spin' : ''} />
            </Button>
          </div>
        }
      />
      {isError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-destructive bg-destructive/5 p-3 text-sm"
        >
          <p>
            {dataUpdatedAt
              ? 'SOS updates interrupted. Showing the last received alerts.'
              : 'Could not load SOS alerts.'}
          </p>
          <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>
            <RefreshCw /> Retry
          </Button>
        </div>
      )}
      {activeAlerts.length >= 500 && (
        <p role="alert" className="text-sm text-amber-700">
          Showing the latest 500 open alerts. Earlier alerts may also be active.
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
        <section aria-label="Open SOS alerts" className="order-2 min-w-0 space-y-3 lg:order-1">
          <div className="flex min-h-10 items-center gap-2 pb-3">
            <Siren className="h-5 w-5 text-destructive" />
            <h2 className="text-base font-semibold">Open alerts</h2>
            {dataUpdatedAt > 0 && (
              <Badge variant={activeAlerts.length ? 'destructive' : 'secondary'}>
                {activeAlerts.length}
              </Badge>
            )}
          </div>
          {isLoading && (
            <p role="status" className="py-8 text-sm text-muted-foreground">
              Loading SOS alerts...
            </p>
          )}
          {!isLoading && !isError && activeAlerts.length === 0 && (
            <p role="status" className="py-8 text-sm text-muted-foreground">
              No active SOS alerts.
            </p>
          )}
          {activeAlerts.map((alert, index) => (
            <article
              key={alert.id}
              aria-label={`SOS alert for ${alert.userName}`}
              className={`space-y-3 rounded-lg border border-l-4 bg-card p-4 ${selected?.id === alert.id ? 'ring-2 ring-primary/40' : ''} ${alert.status === 'ACTIVE' || alert.status === 'ESCALATED' ? 'border-l-red-600' : 'border-l-amber-500'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1 break-words">
                  <h3 className="text-sm font-semibold">
                    {index + 1}. {alert.userName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {alert.userType === 'COMPANION' ? 'Companion' : 'Customer'}
                  </p>
                </div>
                <Badge
                  variant={
                    alert.status === 'ACTIVE' || alert.status === 'ESCALATED'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {SOS_STATUS_LABELS[alert.status]}
                </Badge>
              </div>
              <div className="space-y-1 break-words text-xs text-muted-foreground">
                <p>{alert.sessionId || 'No linked session'}</p>
                <p>Raised {new Date(alert.timestamp).toLocaleString()}</p>
                {alert.otherPartyName && <p>With {alert.otherPartyName}</p>}
                {alert.venue && <p>{alert.venue}</p>}
                {!getSosPosition(alert) && (
                  <p className="text-amber-700 dark:text-amber-400">Location unavailable</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`Locate ${alert.userName}`}
                  aria-pressed={selected?.id === alert.id}
                  disabled={!getSosPosition(alert)}
                  onClick={() => {
                    setSelectedId(alert.id);
                    mapSection.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }}
                >
                  <MapPin /> View map
                </Button>
                <Button variant="outline" size="sm" onClick={() => setContactId(alert.id)}>
                  <Phone /> Contact
                </Button>
                {alert.audioCaptureUrl && (
                  <Button variant="outline" size="sm" onClick={() => setAudioId(alert.id)}>
                    <Headphones /> Recording
                  </Button>
                )}
                {hasPermission(user?.roles ?? [], 'emergency-workflow') && (
                  <Link
                    href="/safety/emergency-workflow"
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    <ShieldAlert /> Workflow
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap gap-2 border-t pt-3">
                {alert.status === 'ACTIVE' && (
                  <Button
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => updateStatus({ id: alert.id, status: 'ACKNOWLEDGED' })}
                  >
                    <CheckCircle /> Acknowledge
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => setResolveId(alert.id)}
                >
                  <CheckCircle /> Mark resolved
                </Button>
              </div>
            </article>
          ))}
        </section>
        <div ref={mapSection} className="order-1 min-w-0 lg:sticky lg:top-0 lg:order-2">
          <SosGoogleMap
            alerts={activeAlerts}
            selected={selected}
            onSelect={setSelectedId}
            onClearSelection={() => setSelectedId(null)}
          />
        </div>
      </div>
      <Dialog open={Boolean(contact)} onOpenChange={(open) => !open && setContactId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact {contact?.userName}</DialogTitle>
          </DialogHeader>
          <p className="break-words text-sm">{contact?.phone || 'Phone number unavailable'}</p>
          {phone && (
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${phone}`} className={buttonVariants()}>
                <Phone /> Call user
              </a>
              <a href={`sms:${phone}`} className={buttonVariants({ variant: 'outline' })}>
                Send message
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(audio?.audioCaptureUrl)}
        onOpenChange={(open) => !open && setAudioId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>SOS audio recording</DialogTitle>
          </DialogHeader>
          {audio?.audioCaptureUrl && (
            <audio controls src={audio.audioCaptureUrl} className="w-full">
              Audio playback is not supported.
            </audio>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(resolving)} onOpenChange={(open) => !open && setResolveId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve SOS alert?</DialogTitle>
          </DialogHeader>
          <p className="break-words text-sm">
            Confirm that {resolving?.userName}&apos;s emergency has been resolved.
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" disabled={isUpdating} onClick={() => setResolveId(null)}>
              Cancel
            </Button>
            <Button
              disabled={isUpdating || !resolving}
              onClick={() =>
                resolving &&
                updateStatus(
                  { id: resolving.id, status: 'RESOLVED' },
                  { onSuccess: () => setResolveId(null) },
                )
              }
            >
              <CheckCircle /> {isUpdating ? 'Resolving...' : 'Confirm resolution'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
