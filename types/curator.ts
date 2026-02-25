export interface CuratorProfile {
    id: string; // Document ID (usually auto-generated or uid)
    displayName: string;
    avatarUrl?: string; // URL to storage or external
    roleLabel: string; // e.g., "Senior Curator", "Aura Guide"

    status: 'online' | 'offline' | 'schedule';
    workingHours?: string; // e.g., "10:00 - 19:00"
    region?: string; // e.g., "RU", "KZ", "Global"

    contacts: {
        whatsapp?: string; // Normalized phone digits
        telegram?: string; // Username without @
        max?: string; // Phone digits for MAX messenger
        phone?: string; // E164 format
    };

    priority: number; // 0-100, higher is preferred for auto-selection
    isEnabled: boolean; // Soft delete / hide
    updatedAt?: string; // ISO Date
}

export type TeamRole = 'owner' | 'admin' | 'editor' | 'curator';

export interface TeamUser {
    uid: string; // Firebase Auth UID
    email: string;
    role: TeamRole;
    linkedCuratorId?: string; // If this user maps to a public profile
    permissions?: string[]; // Granular overrides
    createdAt: string;
}

export const DEFAULT_CURATOR_PROFILE: Partial<CuratorProfile> = {
    status: 'offline',
    priority: 0,
    isEnabled: true,
    contacts: {}
};
