/**
 * SceneARViewer v2 — Type definitions
 */

import * as THREE from 'three';

// ==================== Stage ====================

export type ARStage =
    | 'idle'        // Initial state
    | 'loading'     // Loading GLB models
    | 'ready'       // Models loaded, can start AR
    | 'starting'    // Requesting XR session
    | 'placing'     // Hit-testing, showing reticle
    | 'active'      // Object placed, interaction enabled
    | 'manipulating' // Active gesture in progress (drag/pinch)
    | 'error'       // Error occurred
    | 'unsupported'; // WebXR not supported

export type ARImplementation = 'quick-look' | 'scene-ar-v2' | 'preview-only';

// ==================== Gesture ====================

export type GestureState =
    | { mode: 'none' }
    | {
        mode: 'drag';
        pointerId: number;
        offsetLocal: THREE.Vector3;
    }
    | {
        mode: 'pinch';
        startDistance: number;
        startAngle: number;
        startUserScale: number;
        startRotationY: number;
    };

// ==================== Placed Item ====================

export interface PlacedItem {
    key: string;           // Unique ID (uuid)
    objectId: string;      // Reference to ObjectPublic.id
    group: THREE.Group;    // Three.js container
    baseScale: number;     // Normalized scale (1 = real size)
    userScale: number;     // User-applied scale multiplier
    objectName: string;    // For UI display
}

// ==================== Transform ====================

export interface ObjectTransform {
    position: { x: number; y: number; z: number };
    rotation: { y: number };
    scale: number;
}

// ==================== Props ====================

export interface SceneARViewerV2Props {
    /** Scene configuration with object transforms */
    sceneId: string;
    sceneTitle: string;
    objects: Array<{
        objectId: string;
        name: string;
        modelGlbUrl: string;
        position?: [number, number, number];
        rotation?: [number, number, number];
        scale?: number;
    }>;

    /** Callback when AR session closes */
    onClose: (durationSec?: number, hasStarted?: boolean) => void;

    /** Optional: called when XR session starts */
    onSessionStart?: () => void;

    /** Optional: called when object is placed */
    onPlace?: (objectId: string) => void;
}

// ==================== Events ====================

export interface TransformEvent {
    type: 'move' | 'scale' | 'rotate';
    objectId: string;
    value: number | { x: number; z: number };
    timestamp: number;
}

// ==================== Loading ====================

export interface LoadingProgress {
    loaded: number;
    total: number;
}
