'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { LocateFixed, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiveBookingMarker } from '../types';

type LocatedBooking = LiveBookingMarker & { latitude: number; longitude: number };

function Camera({
  markers,
  selectedId,
  fit,
}: {
  markers: LocatedBooking[];
  selectedId: string | null;
  fit: number;
}) {
  const map = useMap();
  const lastFit = useRef<number | null>(null);
  const selected = markers.find((item) => item.id === selectedId);
  const lat = selected?.latitude;
  const lng = selected?.longitude;
  useEffect(() => {
    if (!map || !markers.length || lastFit.current === fit) return;
    lastFit.current = fit;
    if (markers.length === 1)
      map.moveCamera({ center: { lat: markers[0].latitude, lng: markers[0].longitude }, zoom: 14 });
    else {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach((item) => bounds.extend({ lat: item.latitude, lng: item.longitude }));
      map.fitBounds(bounds, 48);
    }
  }, [map, markers, fit]);
  useEffect(() => {
    if (map && lat !== undefined && lng !== undefined)
      map.moveCamera({ center: { lat, lng }, zoom: 15 });
  }, [map, selectedId, lat, lng]);
  return null;
}

export function BookingGoogleMap({
  markers,
  selectedId,
  onSelect,
}: {
  markers: LiveBookingMarker[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [fit, setFit] = useState(0);
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  const located = useMemo(
    () =>
      markers.filter(
        (item): item is LocatedBooking => item.latitude !== null && item.longitude !== null,
      ),
    [markers],
  );
  useEffect(() => {
    if (!key || ready || failed) return;
    const timer = window.setTimeout(() => setFailed(true), 20000);
    return () => window.clearTimeout(timer);
  }, [key, ready, failed]);
  useEffect(() => {
    const host = window as Window & { gm_authFailure?: () => void };
    const previous = host.gm_authFailure;
    const handler = () => {
      setFailed(true);
      previous?.();
    };
    host.gm_authFailure = handler;
    return () => {
      if (host.gm_authFailure === handler) host.gm_authFailure = previous;
    };
  }, []);
  return (
    <section aria-label="Booking venue map" className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Booking venues ({located.length})</h2>
        <Button
          size="icon"
          variant="outline"
          title="Fit all booking venues"
          aria-label="Fit all booking venues"
          disabled={!key || !located.length}
          onClick={() => {
            onSelect(null);
            setFit((value) => value + 1);
          }}
        >
          <LocateFixed />
        </Button>
      </div>
      <div className="relative h-[360px] overflow-hidden rounded-md border bg-muted sm:h-[480px] lg:h-[560px]">
        {key && !failed && (
          <APIProvider apiKey={key} version="quarterly" onError={() => setFailed(true)}>
            <Map
              aria-label="Active booking venues on Google Maps"
              mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() || 'DEMO_MAP_ID'}
              defaultCenter={{ lat: 22.5, lng: 79 }}
              defaultZoom={5}
              maxZoom={19}
              gestureHandling="cooperative"
              mapTypeControl={false}
              streetViewControl={false}
              fullscreenControl
              zoomControl
              clickableIcons={false}
              onTilesLoaded={() => setReady(true)}
            >
              <Camera markers={located} selectedId={selectedId} fit={fit} />
              {located.map((item) => (
                <AdvancedMarker
                  key={item.id}
                  position={{ lat: item.latitude, lng: item.longitude }}
                  title={`${item.sessionId}: ${item.status}`}
                  onClick={() => onSelect(item.id)}
                  zIndex={selectedId === item.id ? 100 : 1}
                >
                  <Pin
                    background={item.status === 'ARRIVING' ? '#d97706' : '#15803d'}
                    borderColor={selectedId === item.id ? '#111827' : '#ffffff'}
                    glyphColor="#ffffff"
                  />
                </AdvancedMarker>
              ))}
            </Map>
          </APIProvider>
        )}
        {(!key || failed || !ready) && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-muted"
            role={failed ? 'alert' : 'status'}
          >
            {!key || failed ? (
              <MapPin className="h-8 w-8" />
            ) : (
              <RefreshCw className="h-5 w-5 animate-spin" />
            )}
            <p>
              {!key
                ? 'Google Maps is not configured.'
                : failed
                  ? 'Google Maps is unavailable.'
                  : 'Loading Google Maps...'}
            </p>
            {failed && (
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw /> Reload map
              </Button>
            )}
          </div>
        )}
      </div>
      {located.length < markers.length && (
        <p role="status" className="mt-2 text-sm text-muted-foreground">
          Venue location unavailable for {markers.length - located.length} booking(s).
        </p>
      )}
    </section>
  );
}
