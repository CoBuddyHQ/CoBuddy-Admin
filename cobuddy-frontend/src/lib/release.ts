// Flagged chat review remains unavailable until an authenticated chat source provides transcripts.
export const UNRELEASED_ROUTES = ['/moderation/flagged-chats'] as const;

export function isRouteReleased(pathname: string, _environment = process.env.NODE_ENV): boolean {
  return !UNRELEASED_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'));
}
