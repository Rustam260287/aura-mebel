export const COLLECTIONS = {
  /**
   * Canonical domain name: "objects" (NOT products).
   *
   * Legacy note: existing Firestore data may still live under `products`.
   * You can migrate and then set `LABELCOM_OBJECTS_COLLECTION=objects`.
   */
  objects: (process.env.LABELCOM_OBJECTS_COLLECTION || 'products').trim() || 'products',
  blog: 'blog',
  settings: 'settings',
  jobs: 'jobs',
  visitors: 'visitors',
  journeyEvents: 'journeyEvents',
} as const;

