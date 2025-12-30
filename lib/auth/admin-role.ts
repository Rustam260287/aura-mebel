import type { DecodedIdToken } from 'firebase-admin/auth';
import { isAdminToken } from './admin-emails';

export type AdminRole = 'owner' | 'manager';

const parseEmailList = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
};

const OWNER_EMAILS = () => parseEmailList(process.env.OWNER_EMAILS);
const MANAGER_EMAILS = () => parseEmailList(process.env.MANAGER_EMAILS);
const ADMIN_EMAILS = () => parseEmailList(process.env.ADMIN_EMAILS);

export function getAdminRole(decodedToken: DecodedIdToken): AdminRole {
  const token = decodedToken as unknown as { role?: unknown; adminRole?: unknown; email?: unknown };
  const claimRole = token.role ?? token.adminRole;
  if (claimRole === 'owner' || claimRole === 'manager') return claimRole;

  const email = typeof token.email === 'string' ? token.email.toLowerCase() : undefined;
  if (email) {
    // Admin/owner first: full access wins over restricted role if both lists contain the same email.
    if (OWNER_EMAILS().includes(email) || ADMIN_EMAILS().includes(email)) return 'owner';
    if (MANAGER_EMAILS().includes(email)) return 'manager';
  }

  // Safe default: aggregated-only.
  return 'owner';
}
