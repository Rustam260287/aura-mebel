/**
 * SceneARViewer v2 — Constants
 */

// Scale limits for user gestures
export const MIN_USER_SCALE = 0.3;
export const MAX_USER_SCALE = 3.0;

// Touch thresholds
export const MIN_TAP_TARGET_PX = 44;
export const MIN_PINCH_DISTANCE_PX = 12;

// Timing
export const GESTURE_HINT_DURATION_MS = 5000;
export const TRANSFORM_THROTTLE_MS = 500;

// Hit-test / movement
export const MAX_DRAG_DISTANCE_M = 2;

// Rotation
export const MAX_ROTATION_DELTA_RAD = Math.PI * 2;

// Rendering
export const MAX_PIXEL_RATIO = 2;

// Hit-test timing
export const HIT_TEST_TIMEOUT_MS = 3000;
export const FALLBACK_PLACEMENT_DISTANCE_M = 1.5;
export const MIN_PLACEMENT_DISTANCE_M = 1.2;
