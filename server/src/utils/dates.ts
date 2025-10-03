export function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error('Invalid date');
  }
  const [, yearStr, monthStr, dayStr] = match;
  const date = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr)));
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }
  return date;
}

export function parseTime(value: string): { hours: number; minutes: number } {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) {
    throw new Error('Invalid time');
  }
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

export function combineDateAndTime(date: Date, time?: string): Date | null {
  if (!time) {
    return null;
  }
  const { hours, minutes } = parseTime(time);
  const combined = new Date(date.getTime());
  combined.setUTCHours(hours, minutes, 0, 0);
  return combined;
}

export function toISODate(value: Date | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value.toISOString();
}
