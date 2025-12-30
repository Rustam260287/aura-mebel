export type VisitorDevice = 'mobile' | 'desktop';
export type VisitorOs = 'ios' | 'android' | 'other';

export function inferDevice(userAgent: string | undefined): VisitorDevice {
  const ua = userAgent || '';
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? 'mobile' : 'desktop';
}

export function inferOs(userAgent: string | undefined): VisitorOs {
  const ua = userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

export function inferCountry(headers: Record<string, unknown>): string | undefined {
  const candidates = [
    'cf-ipcountry',
    'x-vercel-ip-country',
    'x-appengine-country',
    'x-country',
  ];

  for (const key of candidates) {
    const raw = headers[key] ?? (typeof key === 'string' ? (headers[key.toLowerCase()] as any) : undefined);
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (!value) continue;
    if (/^[A-Za-z]{2}$/.test(value)) return value.toUpperCase();
  }

  return undefined;
}

