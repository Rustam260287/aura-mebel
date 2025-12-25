
// This file controls the visibility of major product scenarios.
// Paused features are kept in the codebase but hidden from the UI.

export const FEATURE_FLAGS = {
  // Primary scenario - always active
  READY_FURNITURE_SCENARIO: true,

  // Secondary scenarios - intentionally paused to maintain focus
  AI_REDESIGN_SCENARIO: false,
  CUSTOM_FURNITURE_SCENARIO: false,
};
