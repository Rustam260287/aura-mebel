export type AdminView =
  | 'crm'
  | 'crmVisitor'
  | 'journey'
  | 'activeVisitors'
  | 'visitorJourney'
  | 'handoffDetail'
  | 'objectInterest'
  | 'savedInsights'
  | 'handoffContacts'
  | 'objects'
  | 'scenes'
  | 'assets'
  | 'media'
  | 'handoff';

export type View =
  | { page: 'home' }
  | { page: 'objects'; objectType?: string }
  | { page: 'object'; objectId: string }
  | { page: 'scenes' }
  | { page: 'scene'; sceneId: string }
  | { page: 'saved' }
  | { page: 'journal' }
  | { page: 'journal-list' }
  | { page: 'journal-entry'; entryId: string }
  | { page: 'admin' }
  | { page: 'scenarios' }
  | { page: 'about' };

export type ObjectStatus = 'draft' | 'ready' | 'archived';

export const VISITOR_STAGES = [
  'VIEW',
  'THREE_D_AR',
  'ACTIVE_TRY',
  'FIXED',
  'READY_TO_TALK',
  'CONTACT_OBTAINED',
  'DIALOGUE',
  'DEAL_CLOSED',
] as const;

export type VisitorStage = (typeof VISITOR_STAGES)[number];

export type ModelProcessingStatus =
  | 'PENDING'
  | 'OPTIMIZING'
  | 'READY'
  | 'ERROR';

export type ModelArtifactInfo = {
  status: ModelProcessingStatus;
  url?: string;
  originalUrl?: string; // For GLB: the raw upload
  sizeBytes?: number;
  originalSizeBytes?: number;
  error?: string;
  updatedAt?: string;
};

export type ModelProcessingInfo = {
  glb: ModelArtifactInfo;
  usdz?: ModelArtifactInfo;
  platforms: {
    web: boolean;
    android: boolean;
    ios: boolean;
  };
  updatedAt: string;

  // Legacy fields for backward compatibility during migration
  status?: string;
  error?: string;
  sizeBeforeBytes?: number;
  sizeAfterBytes?: number;
  maxTextureSize?: number;
};

export interface ObjectPublic {
  id: string;
  name: string;
  objectType?: string;
  category?: string;
  description?: string;
  imageUrls: string[];

  modelGlbUrl?: string;
  modelUsdzUrl?: string;

  has3D?: boolean;

  // Wizard fields for intent-based selection
  mood?: 'calm' | 'soft' | 'expressive' | 'strict';
  presence?: 'compact' | 'balanced' | 'dominant';

  status?: ObjectStatus;
}

export interface ObjectAdmin extends ObjectPublic {
  // status is now inherited from ObjectPublic
  modelProcessing?: ModelProcessingInfo;

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

export type Object3DCategory = 'sofa' | 'armchair' | 'table' | 'chair' | (string & {});

export interface Object3D {
  id: string;
  title: string;
  category: Object3DCategory;
  modelGlbUrl?: string;
  modelUsdzUrl?: string;
  thumbnailUrl: string;
}

export type SceneObjectTransform = {
  objectId: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
};

export interface ScenePresetPublic {
  id: string;
  title: string;
  description?: string;
  objects: SceneObjectTransform[];
  coverImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SceneStatus = 'draft' | 'ready' | 'archived';

export interface ScenePresetAdmin extends ScenePresetPublic {
  status?: SceneStatus;
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
