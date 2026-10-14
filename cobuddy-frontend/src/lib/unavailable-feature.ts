// Unimplemented workflows must never return fabricated records or successful writes.
export function unavailableFeature(workflow: string): never {
  throw new Error(`${workflow} is not available in this release. Backend integration is required.`);
}
