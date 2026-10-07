// These workflows lack a complete, verified backend or required provider integration.
// Remove a route only after its persistence, permissions and integration tests pass.
export const UNRELEASED_ROUTES = [
  '/analytics/safety',
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

export function isRouteReleased(pathname: string, _environment = process.env.NODE_ENV): boolean {
  return !UNRELEASED_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'));
}
