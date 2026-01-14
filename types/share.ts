// Share Record Types
// Used for "Share Experience" feature (link-only, no media)

export interface ShareRecord {
    id: string;
    objectId: string;
    sceneId?: string;
    config?: ShareConfig;
    createdAt: string;
    expiresAt?: string;
    viewCount?: number;
}

export interface ShareConfig {
    /** Object scale in AR */
    scale?: number;
    /** Object rotation */
    rotation?: number;
    /** Any custom placement data */
    placement?: {
        x?: number;
        y?: number;
        z?: number;
    };
}

export interface CreateShareRequest {
    objectId: string;
    sceneId?: string;
    config?: ShareConfig;
}

export interface CreateShareResponse {
    shareId: string;
    shareUrl: string;
}
