import type { FurnitureSelection, ScaleFit, VisualJudgement } from '../types';

/**
 * VisualJudge: Validates realism and harmony.
 * Simulated for now (always approves unless scale is outside bounds).
 */
export class VisualJudge {
    static evaluate(selection: FurnitureSelection, fit: ScaleFit): VisualJudgement {
        const { scale_factor } = fit;
        const issues: string[] = [];

        // Check scale bounds (0.9 to 1.1)
        if (scale_factor < 0.9 || scale_factor > 1.1) {
            issues.push('scale_out_of_bounds');
            return { score: 0.5, issues };
        }

        // Check if model_key exists (basic validation)
        if (!selection.model_key || selection.model_key === 'default') {
            issues.push('fallback_model_used');
            return { score: 0.75, issues };
        }

        // All checks passed
        return { score: 0.9, issues: [] };
    }
}
