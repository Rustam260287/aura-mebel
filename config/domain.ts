/**
 * Domain Configuration - Aura
 * 
 * Centralized configuration for business logic.
 * This file should be the SINGLE SOURCE OF TRUTH for:
 * - Categories and their properties
 * - MetaAgent timings
 * - Feature flags
 * 
 * Migration Note (2026-01-14):
 * Previously, category logic was hardcoded in publicObject.ts.
 * Now all objects have explicit status in DB.
 */

// =============================================================================
// CATEGORIES
// =============================================================================

export interface CategoryDefinition {
    /** Display name (Russian) */
    label: string;
    /** URL-safe slug */
    slug: string;
    /** Alternative names for matching (search, legacy data) */
    aliases: string[];
    /** Is this category publicly visible in production? */
    isPublic: boolean;
}

export const CATEGORIES: Record<string, CategoryDefinition> = {
    soft: {
        label: 'Мягкая мебель',
        slug: 'soft',
        aliases: ['мягкая мебель', 'sofa', 'диваны', 'кресла', 'пуфы', 'sofas', 'armchairs'],
        isPublic: true,
    },
    living: {
        label: 'Гостиная',
        slug: 'living',
        aliases: ['гостиная', 'living room', 'living'],
        isPublic: false, // Draft - not ready for production
    },
    bedroom: {
        label: 'Спальни',
        slug: 'bedroom',
        aliases: ['спальни', 'спальня', 'bedroom', 'bedrooms'],
        isPublic: false,
    },
    kitchen: {
        label: 'Кухни',
        slug: 'kitchen',
        aliases: ['кухни', 'кухня', 'kitchen', 'kitchens'],
        isPublic: false,
    },
};

/** Get categories visible in production catalog */
export const getPublicCategories = (): CategoryDefinition[] =>
    Object.values(CATEGORIES).filter(c => c.isPublic);

/** Get all categories (for admin/dev) */
export const getAllCategories = (): CategoryDefinition[] =>
    Object.values(CATEGORIES);

/** Find category by any of its aliases (case-insensitive) */
export const findCategoryByAlias = (input: string): CategoryDefinition | undefined => {
    const normalized = input.toLowerCase().trim();
    return Object.values(CATEGORIES).find(cat =>
        cat.aliases.some(alias => normalized.includes(alias.toLowerCase()))
    );
};

// =============================================================================
// META-AGENT TIMINGS (milliseconds)
// =============================================================================

export const AGENT_TIMINGS = {
    /** Time on page before showing onboarding hint */
    ONBOARDING_HINT_MIN_MS: 2000,
    ONBOARDING_HINT_MAX_MS: 10000,

    /** Time stuck in AR preparing before showing guidance */
    AR_GUIDANCE_DELAY_MS: 8000,

    /** Time before showing AR hint (if 3D opened, AR not opened) */
    AR_HINT_DELAY_MS: 12000,

    /** Time before showing soft CTA (if gallery scrolled, 3D not opened) */
    SOFT_CTA_DELAY_MS: 20000,

    /** Time before showing contact suggestion (if hesitating) */
    CONTACT_SUGGESTION_DELAY_MS: 45000,

    /** Extended time for contact suggestion after AR */
    CONTACT_SUGGESTION_AFTER_AR_MS: 60000,

    /** Transition to "hesitating" state threshold */
    HESITATING_THRESHOLD_MS: 15000,
} as const;

// =============================================================================
// FEATURE FLAGS
// =============================================================================

export const FEATURES = {
    /** Show all categories in dev mode */
    DEV_SHOW_ALL_CATEGORIES: true,

    /** Show draft objects in dev mode */
    DEV_SHOW_DRAFTS: true,

    /** Enable AR snapshot feature */
    AR_SNAPSHOT_ENABLED: true,

    /** Enable AI Vision analysis */
    AI_VISION_ENABLED: true,

    /** Enable Wizard flow */
    WIZARD_ENABLED: true,

    /** Enable Redesign feature */
    REDESIGN_ENABLED: true,
} as const;

// =============================================================================
// OBJECT STATUS
// =============================================================================

export const OBJECT_STATUSES = {
    READY: 'ready',
    DRAFT: 'draft',
    ARCHIVED: 'archived',
} as const;

export type ObjectStatusValue = typeof OBJECT_STATUSES[keyof typeof OBJECT_STATUSES];

/** Normalize various status synonyms to canonical values */
export const normalizeStatus = (raw: string | undefined | null): ObjectStatusValue => {
    const status = (raw || '').trim().toLowerCase();
    if (status === 'ready' || status === 'active' || status === 'published') {
        return OBJECT_STATUSES.READY;
    }
    if (status === 'archived') {
        return OBJECT_STATUSES.ARCHIVED;
    }
    return OBJECT_STATUSES.DRAFT;
};
