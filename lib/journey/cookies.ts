export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};

  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rawValueParts] = part.split('=');
    const name = (rawName || '').trim();
    if (!name) continue;
    const value = rawValueParts.join('=').trim();
    result[name] = decodeURIComponent(value);
  }

  return result;
}

type CookieOptions = {
  maxAgeSec?: number;
  httpOnly?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
  secure?: boolean;
  path?: string;
};

export function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  const parts: string[] = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAgeSec != null) parts.push(`Max-Age=${Math.floor(options.maxAgeSec)}`);
  parts.push(`Path=${options.path || '/'}`);
  parts.push(`SameSite=${options.sameSite || 'Lax'}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');

  return parts.join('; ');
}

