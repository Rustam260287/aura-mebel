/**
 * SceneARViewer v2 — Public exports
 */

export { SceneARViewerV2 } from './SceneARViewerV2';
export { shouldUseSceneARV2, detectPlatform, checkWebXRSupport } from './platformDetect';
// Public constants useful for UI/Analytics
export { MIN_USER_SCALE, MAX_USER_SCALE, GESTURE_HINT_DURATION_MS } from './constants';

export type {
    SceneARViewerV2Props,
    ARStage,
    PlacedItem,
    ObjectTransform,
    ARImplementation
} from './types';
