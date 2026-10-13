export function label(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'en' in value && typeof value.en === 'string')
    return value.en;
  return '';
}
