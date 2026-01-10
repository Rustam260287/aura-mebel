/**
 * Global Feature Flags
 * 
 * Philosophy: 
 * All experimental or platform-specific builds that require external dependencies
 * (e.g. iOS App Clip needing Xcode build) must be guarded by flags.
 * 
 * Flags should be explicitly set to false in main branch until the feature 
 * is fully ready and compatible with the current deployment environment.
 */

export const FEATURES = {
    /**
     * Enables iOS App Clip Smart App Banner and integration logic.
     * 
     * ⚠️ PAUSED: Requires macOS compilation and App Store submission.
     * Current status: Architecture documented in docs/ios/app-clip-architecture.md
     * 
     * @default false
     */
    APP_CLIP_ENABLED: false,
};
