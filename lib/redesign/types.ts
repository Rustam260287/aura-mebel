// AI Room Redesign Types

export interface RedesignInput {
    roomImageUrl: string;
    object_type: 'sofa' | 'armchair' | 'bed' | 'table' | 'chair';
    style: 'minimal' | 'cozy' | 'modern' | 'classic';
    mood: 'calm' | 'warm' | 'fresh' | 'dramatic';
}

export interface RedesignVariant {
    imageUrl: string;
    label: string;
    preset: 'creative' | 'balanced' | 'subtle';
}

export interface RedesignResult {
    before: string;
    after: string;
    currentPreset?: 'creative' | 'balanced' | 'subtle';
    variants?: RedesignVariant[];
    selectedFurniture: {
        id: string;
        name: string;
        imageUrl?: string;
        modelGlbUrl?: string;
    };
    processingTime: number;
}

export interface RedesignProgress {
    stage: 'uploading' | 'analyzing' | 'selecting' | 'generating' | 'compositing' | 'done' | 'error';
    percent: number;
    message: string;
}
