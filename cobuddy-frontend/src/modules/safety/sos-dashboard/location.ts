import type { SosAlert } from './types';

export function getSosPosition(alert: Pick<SosAlert, 'latitude' | 'longitude'>) {
  const { latitude, longitude } = alert;
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }
  return { lat: latitude, lng: longitude };
}

export function getSosMapLinks(alert: Pick<SosAlert, 'latitude' | 'longitude'>) {
  const position = getSosPosition(alert);
  if (!position) return null;
  const coordinates = encodeURIComponent(`${position.lat},${position.lng}`);
  return {
    map: `https://www.google.com/maps/search/?api=1&query=${coordinates}`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${coordinates}`,
  };
}

export const SOS_STATUS_LABELS: Record<SosAlert['status'], string> = {
  ACTIVE: 'Active',
  ACKNOWLEDGED: 'Acknowledged',
  INVESTIGATING: 'Investigating',
  ESCALATED: 'Escalated',
  RESOLVED: 'Resolved',
  UNKNOWN: 'Review required',
};
