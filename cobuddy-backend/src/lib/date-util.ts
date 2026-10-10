import { add } from 'date-fns';

export function addDuration(duration: string, from: Date = new Date()): Date {
  const match = /^(\d+)([smhdwy])$/.exec(duration);
  if (!match) {
    try {
      const m = /^(\d+)(minute|hour|day|week|month|year)s?$/i.exec(duration);
      if (!m) return add(from, { minutes: 15 });
      const n = Number(m[1]);
      const key = m[2].toLowerCase();
      const map: any = {
        minute: 'minutes',
        hour: 'hours',
        day: 'days',
        week: 'weeks',
        month: 'months',
        year: 'years',
      };
      return add(from, { [map[key]]: n });
    } catch {
      return add(from, { minutes: 15 });
    }
  }
  const n = Number(match[1]);
  const key = match[2];
  const map: any = { s: 'seconds', m: 'minutes', h: 'hours', d: 'days', w: 'weeks', y: 'years' };
  return add(from, { [map[key]]: n });
}
