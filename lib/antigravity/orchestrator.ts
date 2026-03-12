import type { WizardIntent, FittingResult, RoomContext, RoomAnalysis } from './types';
import { IntentAgent } from './agents/intent';
import { FurnitureSelector } from './agents/selector';
import { ScaleAndFitAgent } from './agents/fitter';
import { VisualJudge } from './agents/judge';
import { ContextAgent } from './agents/context';
import { BrandIntegrityAgent } from './agents/brandIntegrity';

/**
 * Antigravity Orchestrator: Coordinates agents to produce furniture fitting result.
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                        AGENT WORKFLOW                                   │
 * │                                                                         │
 * │  [Photo/Description]                                                    │
 * │         │                                                               │
 * │         ▼                                                               │
 * │  ┌─────────────────┐                                                    │
 * │  │  ContextAgent   │ ──▶ Анализ комнаты (тип, освещение, зоны)         │
 * │  └─────────────────┘                                                    │
 * │         │                                                               │
 * │         ▼                                                               │
 * │  ┌─────────────────┐                                                    │
 * │  │  IntentAgent    │ ──▶ Интерпретация намерений пользователя          │
 * │  └─────────────────┘                                                    │
 * │         │                                                               │
 * │         ▼                                                               │
 * │  ┌─────────────────┐                                                    │
 * │  │ FurnitureSelect │ ──▶ Выбор мебели из каталога                      │
 * │  └─────────────────┘                                                    │
 * │         │                                                               │
 * │         ▼                                                               │
 * │  ┌─────────────────┐                                                    │
 * │  │ ScaleAndFitAgent│ ──▶ Расчёт масштаба                               │
 * │  └─────────────────┘                                                    │
 * │         │                                                               │
 * │         ▼                                                               │
 * │  ┌─────────────────┐                                                    │
 * │  │  VisualJudge    │ ──▶ Валидация результата (retry если score < 0.8) │
 * │  └─────────────────┘                                                    │
 * │         │                                                               │
 * │         ▼                                                               │
 * │     [Result]                                                            │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

/**
 * Расширенный результат с контекстом комнаты
 */
export interface EnhancedFittingResult extends FittingResult {
    room_analysis?: RoomAnalysis;
}

/**
 * Основной workflow с анализом контекста комнаты
 */
export async function runWizardWithContext(
    input: WizardIntent,
    roomContext?: RoomContext
): Promise<EnhancedFittingResult> {
    // Step 0: Анализ контекста комнаты (если есть фото/описание)
    let roomAnalysis: RoomAnalysis | undefined;
    if (roomContext) {
        roomAnalysis = await ContextAgent.analyze(roomContext);
        console.log('[ContextAgent] Room analysis:', roomAnalysis.room_type,
            '| Confidence:', roomAnalysis.confidence);
    }

    // Agent: Brand Integrity Check (Silent background process)
    // Runs alongside the wizard to ensure brand consistency
    BrandIntegrityAgent.analyze().then(report => {
        if (!report.isClean) {
            console.warn('[BrandIntegrity] Issues found:', report.issues);
        } else {
            console.log('[BrandIntegrity] System is clean.');
        }
    }).catch(err => {
        console.error('[BrandIntegrity] Analysis failed:', err);
    });

    // Simulate "thoughtful" processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Step 1: Interpret Intent
    const profile = IntentAgent.interpret(input);

    // Step 2: Select Furniture (async Firestore query)
    const selection = await FurnitureSelector.select(input, profile);

    // Step 3: Calculate Scale
    const fit = ScaleAndFitAgent.calculateScale(input);

    // Step 4: Validate
    let judgement = VisualJudge.evaluate(selection, fit);

    // Retry logic: if score < 0.8, simplify and retry once
    if (judgement.score < 0.8) {
        // Simplify: reduce presence to "balanced"
        const simplifiedInput = { ...input, presence: 'balanced' as const };
        const simplifiedFit = ScaleAndFitAgent.calculateScale(simplifiedInput);
        judgement = VisualJudge.evaluate(selection, simplifiedFit);

        // Use simplified fit if better
        if (judgement.score >= 0.8) {
            return {
                object_id: selection.object_id,
                scale: simplifiedFit.scale_factor,
                intent: profile.intent_profile,
                asset_key: selection.asset_key,
                room_analysis: roomAnalysis,
            };
        }
    }

    // Return final result
    return {
        object_id: selection.object_id,
        scale: fit.scale_factor,
        intent: profile.intent_profile,
        asset_key: selection.asset_key,
        room_analysis: roomAnalysis,
    };
}

/**
 * Legacy function: Original workflow without room context
 * @deprecated Use runWizardWithContext instead
 */
export async function runWizardIntent(input: WizardIntent): Promise<FittingResult> {
    // Simulate "thoughtful" processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Step 1: Interpret Intent
    const profile = IntentAgent.interpret(input);

    // Step 2: Select Furniture (async Firestore query)
    const selection = await FurnitureSelector.select(input, profile);

    // Step 3: Calculate Scale
    const fit = ScaleAndFitAgent.calculateScale(input);

    // Step 4: Validate
    let judgement = VisualJudge.evaluate(selection, fit);

    // Retry logic: if score < 0.8, simplify and retry once
    if (judgement.score < 0.8) {
        // Simplify: reduce presence to "balanced"
        const simplifiedInput = { ...input, presence: 'balanced' as const };
        const simplifiedFit = ScaleAndFitAgent.calculateScale(simplifiedInput);
        judgement = VisualJudge.evaluate(selection, simplifiedFit);

        // Use simplified fit if better
        if (judgement.score >= 0.8) {
            return {
                object_id: selection.object_id,
                scale: simplifiedFit.scale_factor,
                intent: profile.intent_profile,
                asset_key: selection.asset_key,
            };
        }
    }

    // Return final result
    return {
        object_id: selection.object_id,
        scale: fit.scale_factor,
        intent: profile.intent_profile,
        asset_key: selection.asset_key,
    };
}

