// Antigravity Types: Intent-based furniture selection

export type ObjectType = 'sofa' | 'armchair' | 'bed' | 'table' | 'chair' | 'shelf';
export type Presence = 'compact' | 'balanced' | 'dominant';
export type Mood = 'calm' | 'soft' | 'expressive' | 'strict';
export type SpaceContext = 'photo' | 'ar' | 'unknown';

export interface WizardIntent {
    object_type: ObjectType;
    presence: Presence;
    mood: Mood;
    space_context?: SpaceContext;
}

export interface IntentProfile {
    intent_profile: string; // e.g., "soft_balanced_presence"
}

export interface SpaceConstraints {
    constraints: string[];
}

export interface FurnitureSelection {
    object_id: string; // Canonical catalog object selected for the experience
    asset_key?: string; // Optional pre-generated asset key for future AR/runtime mapping
}

export interface ScaleFit {
    scale_factor: number; // Between 0.9 and 1.1
}

export interface VisualJudgement {
    score: number; // 0.0 to 1.0
    issues: string[];
}

export interface FittingResult {
    object_id: string;
    scale: number;
    intent: string;
    asset_key?: string;
}

// ============================================
// ContextAgent Types - Анализ контекста комнаты
// ============================================

export type RoomType = 'living_room' | 'bedroom' | 'kitchen' | 'office' | 'dining' | 'unknown';
export type LightingCondition = 'natural' | 'artificial' | 'mixed' | 'dim';
export type ColorTemperature = 'warm' | 'neutral' | 'cool';

/**
 * Входные данные для ContextAgent
 */
export interface RoomContext {
    imageUrl?: string;           // URL изображения комнаты
    imageBase64?: string;        // Base64 изображения (альтернатива)
    userDescription?: string;    // Описание от пользователя
}

/**
 * Результат анализа комнаты от ContextAgent
 */
export interface RoomAnalysis {
    room_type: RoomType;                    // Тип комнаты
    lighting: LightingCondition;            // Условия освещения
    color_temperature: ColorTemperature;    // Цветовая температура
    dominant_colors: string[];              // Доминирующие цвета (hex)
    estimated_area: 'small' | 'medium' | 'large';  // Примерная площадь
    style_hints: string[];                  // Подсказки по стилю
    furniture_zones: FurnitureZone[];       // Зоны для мебели
    confidence: number;                     // Уверенность анализа (0-1)
}

/**
 * Зона для размещения мебели
 */
export interface FurnitureZone {
    position: 'center' | 'left' | 'right' | 'corner' | 'wall';
    suitableFor: ObjectType[];             // Какая мебель подходит
    priority: number;                       // Приоритет зоны (1-10)
}

// ============================================
// BrandIntegrityAgent Types - Охрана бренда
// ============================================

export interface BrandIntegrityIssue {
    area: 'pwa' | 'meta' | 'ui' | 'code';
    severity: 'critical' | 'warning';
    description: string;
    file?: string;
    recommendation: string;
}

export interface BrandIntegrityReport {
    isClean: boolean;
    issues: BrandIntegrityIssue[];
}
