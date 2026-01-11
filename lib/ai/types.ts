export type AgentRole = 'supervisor' | 'vision' | 'catalog' | 'guardian' | 'math';

// Core contract for serialized communication
export type AgentResponse =
    | {
        type: "text";
        content: string;
        role: 'user' | 'assistant';
        suggestions?: string[];
    }
    | {
        type: "component";
        component: string;
        props: Record<string, any>;
        role: 'assistant';
        suggestions?: string[];
    };

// Legacy support if needed, but AgentResponse is primary
export interface AgentMessage extends Partial<any> {
    // Keeping this for compatibility with existing state code, but
    // in the new system we should primarily use AgentResponse logic.
    role: 'user' | 'assistant' | 'system' | 'function';
    content: string;
    name?: string;
    // We'll map 'component' to our new structure in the renderer
    ui?: {
        id: string;
        props: any;
    };
    suggestions?: string[];
    metadata?: Record<string, any>;
}

export interface SessionState {
    sessionId: string;
    history: AgentMessage[];
    context: {
        roomAnalysis?: RoomAnalysis;
        selectedProducts: string[]; // Product IDs
        lastShownProducts?: any[]; // For refinement context
        intent: string;
    };
}

export interface FurnitureZone {
    position: 'center' | 'left' | 'right' | 'corner' | 'wall';
    suitableFor: ('sofa' | 'armchair' | 'bed' | 'table' | 'chair' | 'shelf')[];
    priority: number;
}

export interface RoomAnalysis {
    room_type: 'living_room' | 'bedroom' | 'kitchen' | 'office' | 'dining' | 'unknown';
    style: string;
    mood?: string;
    reasoning?: string;
    recommendations?: string[];
    lighting: 'natural' | 'artificial' | 'mixed' | 'dim';
    colors: string[];
    // Legacy / Optional technical fields
    furniture_zones?: FurnitureZone[];
    layout_suggestions?: { item: string; x: number; y: number }[];
    confidence?: number;
}

export interface ActionPlan {
    nextAgent: AgentRole;
    reasoning: string;
    displayStatus: string; // "Looking for sofas..."
}
