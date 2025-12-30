export type AdminView =
  | 'journey'
  | 'activeVisitors'
  | 'visitorJourney'
  | 'handoffDetail'
  | 'objectInterest'
  | 'savedInsights'
  | 'handoffContacts'
  | 'objects'
  | 'assets'
  | 'media'
  | 'handoff';

export type View =
  | { page: 'home' }
  | { page: 'objects'; objectType?: string }
  | { page: 'object'; objectId: string }
  | { page: 'saved' }
  | { page: 'journal' }
  | { page: 'journal-list' }
  | { page: 'journal-entry'; entryId: string }
  | { page: 'admin' }
  | { page: 'scenarios' }
  | { page: 'about' };

export type ObjectStatus = 'draft' | 'ready' | 'archived';

export interface ObjectPublic {
  id: string;
  name: string;
  objectType?: string;
  description?: string;
  imageUrls: string[];

  modelGlbUrl?: string;
  modelUsdzUrl?: string;

  has3D?: boolean;
}

export interface ObjectAdmin extends ObjectPublic {
  status?: ObjectStatus;

  tags?: string[];
  styleTags?: string[];
  materialTags?: string[];
  colorTags?: string[];
  formTags?: string[];

  specs?: Record<string, string>;

  upscaledImageUrl?: string;
  details?: unknown;
  isConfigurable?: boolean;
  configurationOptions?: unknown[];
  createdAt?: string;
  updatedAt?: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  tags?: string[];
  author?: string;
  createdAt?: string;
  date?: string;
  status?: 'draft' | 'published' | string;
  relatedObjectIds?: string[];
  imagePrompt?: string;
}

// Intentionally no public "project" or CRM-like entities:
// The core experience is anonymous try-on + saving + hand-off.
