export function getLocalizedText(field: Record<string, string> | string | undefined, locale: string = 'en'): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[locale] || field['en'] || Object.values(field)[0] || '';
}
