'use client';

import { useState } from 'react';
import { Navigation, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useLiveMap } from '@/modules/operations/live-map/hooks/useLiveMap';
import { BookingGoogleMap } from '@/modules/operations/live-map/components/BookingGoogleMap';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';

export default function LiveMapPage() {
  const { markers, isLoading, isError, isFetching, refetch, updatedAt } = useLiveMap();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = markers.find((item) => item.id === selectedId);
  if (isLoading) return <div role="status">Loading active bookings...</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Live Booking Map" />
        <Button
          size="icon"
          variant="outline"
          title="Refresh bookings"
          aria-label="Refresh bookings"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          <RefreshCw className={isFetching ? 'animate-spin' : ''} />
        </Button>
      </div>
      {isError && (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-destructive">
          {updatedAt
            ? 'Updates interrupted. Showing the last received bookings.'
            : 'Could not load active bookings.'}
          <Button variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      )}
      {updatedAt > 0 && (
        <p className="text-xs text-muted-foreground">
          Last received: {new Date(updatedAt).toLocaleTimeString()}
        </p>
      )}
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(240px,1fr)_minmax(0,2fr)]">
        <section aria-label="Active bookings" className="min-w-0">
          <h2 className="mb-3 text-base font-semibold">Active Sessions ({markers.length})</h2>
          {markers.length >= 500 && (
            <p role="status" className="mb-3 text-sm text-amber-700">
              Showing the latest 500 sessions. Additional sessions may not be displayed.
            </p>
          )}
          {!isError && !markers.length && (
            <p className="py-4 text-sm text-muted-foreground">No active sessions.</p>
          )}
          <ul className="divide-y">
            {markers.map((item) => (
              <li key={item.id} className="py-3">
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  aria-pressed={selectedId === item.id}
                  className={`w-full min-w-0 space-y-2 rounded-sm p-2 text-left focus-visible:outline-2 ${selectedId === item.id ? 'bg-muted' : 'hover:bg-muted/60'}`}
                >
                  <span className="block break-all text-sm font-medium">{item.sessionId}</span>
                  <span className="block break-words text-xs text-muted-foreground">
                    {item.companionName} / {item.userName}
                  </span>
                  <Badge variant={item.status === 'ARRIVING' ? 'outline' : 'secondary'}>
                    {item.status.replaceAll('_', ' ')}
                  </Badge>
                  {item.latitude === null && (
                    <span className="block text-xs text-muted-foreground">
                      Venue location unavailable
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
        <div className="min-w-0">
          <BookingGoogleMap markers={markers} selectedId={selectedId} onSelect={setSelectedId} />
          {selected && (
            <section aria-label="Selected booking venue" className="space-y-3 border-b py-4">
              <h3 className="break-all text-sm font-semibold">{selected.sessionId}</h3>
              <p className="text-sm text-muted-foreground">
                {selected.latitude !== null && selected.longitude !== null
                  ? `Venue coordinates: ${selected.latitude.toFixed(6)}, ${selected.longitude.toFixed(6)}`
                  : 'Venue location unavailable'}
              </p>
              {selected.latitude !== null && selected.longitude !== null && (
                <a
                  className={buttonVariants({ variant: 'outline' })}
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${selected.latitude},${selected.longitude}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation /> Directions to venue
                </a>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
