'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AdvancedMarker,
  APIProvider,
  Map as GoogleMap,
  Pin,
  useMap,
} from '@vis.gl/react-google-maps';
import { ExternalLink, LocateFixed, MapPin, Navigation, RefreshCw } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { getSosMapLinks, getSosPosition, SOS_STATUS_LABELS } from '../location';
import type { SosAlert } from '../types';

type LocatedAlert = { alert: SosAlert; position: google.maps.LatLngLiteral; number: number };

function MapCamera({
  locations,
  selected,
  fitRequest,
}: {
  locations: LocatedAlert[];
  selected: SosAlert | undefined;
  fitRequest: number;
}) {
  const map = useMap();
  const lastFit = useRef<number | null>(null);
  const position = selected ? getSosPosition(selected) : null;
  const lat = position?.lat;
  const lng = position?.lng;

  useEffect(() => {
    if (!map) return;
    if (!locations.length) {
      lastFit.current = null;
      return;
    }
    if (lastFit.current === fitRequest) return;
    lastFit.current = fitRequest;
    if (locations.length === 1) {
      map.moveCamera({ center: locations[0].position, zoom: 15 });
    } else {
      const bounds = new google.maps.LatLngBounds();
      locations.forEach(({ position: point }) => bounds.extend(point));
      map.fitBounds(bounds, 56);
    }
  }, [map, locations, fitRequest]);

  useEffect(() => {
    if (!map || lat === undefined || lng === undefined) return;
    map.panTo({ lat, lng });
    map.setZoom(Math.max(map.getZoom() ?? 15, 15));
  }, [map, selected?.id, lat, lng]);

  return null;
}

function MapCanvas({
  alerts,
  selected,
  onSelect,
  fitRequest,
}: {
  alerts: SosAlert[];
  selected: SosAlert | undefined;
  onSelect: (id: string) => void;
  fitRequest: number;
}) {
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  const handleLoadError = useCallback(() => setError(true), []);
  const locations = useMemo(
    () =>
      alerts.flatMap((alert, index) => {
        const position = getSosPosition(alert);
        return position ? [{ alert, position, number: index + 1 }] : [];
      }),
    [alerts],
  );

  useEffect(() => {
    const host = window as Window & { gm_authFailure?: () => void };
    const previous = host.gm_authFailure;
    const failed = () => {
      setError(true);
      previous?.();
    };
    host.gm_authFailure = failed;
    return () => {
      if (host.gm_authFailure === failed) host.gm_authFailure = previous;
    };
  }, []);

  useEffect(() => {
    if (ready || error) return;
    const timer = window.setTimeout(() => setError(true), 20000);
    return () => window.clearTimeout(timer);
  }, [ready, error]);

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!.trim()}
      version="quarterly"
      onError={handleLoadError}
    >
      {!error && (
        <GoogleMap
          aria-label="SOS alert locations on Google Maps"
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() || 'DEMO_MAP_ID'}
          defaultCenter={{ lat: 22.5, lng: 79 }}
          defaultZoom={5}
          minZoom={3}
          maxZoom={19}
          gestureHandling="cooperative"
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl
          zoomControl
          clickableIcons={false}
          onTilesLoaded={() => setReady(true)}
        >
          <MapCamera locations={locations} selected={selected} fitRequest={fitRequest} />
          {locations.map(({ alert, position, number }) => (
            <AdvancedMarker
              key={alert.id}
              position={position}
              title={`${number}. ${alert.userName}: ${SOS_STATUS_LABELS[alert.status]}`}
              onClick={() => onSelect(alert.id)}
              zIndex={selected?.id === alert.id ? 1000 : alert.status === 'ACTIVE' ? 100 : 1}
            >
              <Pin
                background={
                  alert.status === 'ACTIVE' || alert.status === 'ESCALATED' ? '#dc2626' : '#d97706'
                }
                borderColor={selected?.id === alert.id ? '#111827' : '#ffffff'}
                glyphColor="#ffffff"
                glyphText={String(number)}
                scale={selected?.id === alert.id ? 1.25 : 1}
              />
            </AdvancedMarker>
          ))}
        </GoogleMap>
      )}
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted" role="status">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading Google Maps...
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted p-6 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <p role="alert" className="text-sm">
            Google Maps is unavailable.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw /> Reload map
          </Button>
        </div>
      )}
    </APIProvider>
  );
}

export function SosGoogleMap({
  alerts,
  selected,
  onSelect,
  onClearSelection,
}: {
  alerts: SosAlert[];
  selected: SosAlert | undefined;
  onSelect: (id: string) => void;
  onClearSelection: () => void;
}) {
  const [fitRequest, setFitRequest] = useState(0);
  const hasKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim());
  const locatedCount = alerts.filter((alert) => getSosPosition(alert)).length;
  const position = selected ? getSosPosition(selected) : null;
  const links = selected ? getSosMapLinks(selected) : null;

  return (
    <section aria-label="Live SOS map" className="min-w-0">
      <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 pb-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="text-base font-semibold">Live map</h2>
          <span className="text-xs text-muted-foreground">{locatedCount} located</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          title="Fit all alert locations"
          aria-label="Fit all alert locations"
          disabled={!hasKey || !locatedCount}
          onClick={() => {
            onClearSelection();
            setFitRequest((value) => value + 1);
          }}
        >
          <LocateFixed />
        </Button>
      </div>
      <div className="relative h-[360px] overflow-hidden rounded-lg border bg-muted sm:h-[480px] lg:h-[560px]">
        {hasKey ? (
          <MapCanvas
            alerts={alerts}
            selected={selected}
            onSelect={onSelect}
            fitRequest={fitRequest}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
            <MapPin className="h-8 w-8" />
            <p className="text-sm" role="status">
              Google Maps is not configured.
            </p>
          </div>
        )}
      </div>
      {locatedCount < alerts.length && (
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-400" role="status">
          Location unavailable for {alerts.length - locatedCount} alert(s).
        </p>
      )}
      {selected && (
        <div className="space-y-3 border-b py-4" aria-label="Selected alert location">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 break-words">
              <p className="font-medium">{selected.userName}</p>
              <p className="text-sm text-muted-foreground">
                {selected.sessionId || 'No linked session'}
              </p>
            </div>
            <span className="text-xs font-medium">{SOS_STATUS_LABELS[selected.status]}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {position
              ? `Reported location: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
              : 'Location unavailable'}
          </p>
          {links && (
            <div className="flex flex-wrap gap-2">
              <a
                href={links.directions}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'outline' })}
              >
                <Navigation /> Directions
              </a>
              <a
                href={links.map}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'outline' })}
              >
                <ExternalLink /> Google Maps
              </a>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
