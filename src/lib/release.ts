// These workflows still depend on demo data or an unconfigured provider.
// Remove a route only after its persistence, permissions and integration tests pass.
export const UNRELEASED_ROUTES = [
  '/analytics',
  '/discovery',
  '/legal',
  '/marketing',
  '/operations/city-launch',
  '/operations/growth-abuse',
  '/operations/venues',
  '/platform-config',
  '/support',
  '/moderation/flagged-chats',
] as const;

export function isRouteReleased(pathname: string, environment = process.env.NODE_ENV): boolean {
  if (environment !== 'production') return true;
  return !UNRELEASED_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'));
}
