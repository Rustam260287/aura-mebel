const parseList = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
};

export const getAdminEmails = (): string[] => {
  const direct = parseList(process.env.ADMIN_EMAILS);
  const owners = parseList(process.env.OWNER_EMAILS);
  const managers = parseList(process.env.MANAGER_EMAILS);
  return Array.from(new Set([...direct, ...owners, ...managers]));
};

export const getAdminUids = (): string[] => {
  return parseList(process.env.ADMIN_UIDS);
};

export const isAdminEmail = (email: unknown): boolean => {
  if (typeof email !== 'string') return false;
  return getAdminEmails().includes(email.toLowerCase());
};

export const isAdminUid = (uid: unknown): boolean => {
  if (typeof uid !== 'string') return false;
  return getAdminUids().includes(uid.toLowerCase());
};

export const isAdminToken = (decodedToken: unknown): boolean => {
  if (!decodedToken || typeof decodedToken !== 'object') return false;
  const token = decodedToken as {
    uid?: unknown;
    email?: unknown;
    admin?: unknown;
    role?: unknown;
    adminRole?: unknown;
  };

  if (token.admin === true) return true;

  const claimRole = token.role ?? token.adminRole;
  if (claimRole === 'owner' || claimRole === 'manager') return true;

  if (isAdminUid(token.uid)) return true;
  return isAdminEmail(token.email);
};
