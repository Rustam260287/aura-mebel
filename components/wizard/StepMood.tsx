import React from 'react';
import { useWizard } from '../../contexts/WizardContext';
import type { Mood } from '../../lib/antigravity/types';

const OPTIONS: { value: Mood; label: string; color: string }[] = [
    { value: 'calm', label: 'Спокойный', color: 'bg-stone-200' },
    { value: 'soft', label: 'Мягкий', color: 'bg-stone-100' },
    { value: 'expressive', label: 'Выразительный', color: 'bg-stone-300' },
    { value: 'strict', label: 'Строгий', color: 'bg-stone-400' },
];

export const StepMood: React.FC = () => {
    const { setSelection, submitWizard, prevStep, selections, isGenerating, error } = useWizard();

    const handleSelect = async (value: Mood) => {
        if (isGenerating) return;
        setSelection('mood', value);
        await submitWizard({ mood: value });
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-medium text-soft-black">Настроение</h2>
                    <p className="text-sm text-muted-gray">Какой характер вам ближе?</p>
                </div>

                {isGenerating ? (
                    <div className="rounded-[28px] border border-stone-beige/40 bg-white/80 px-6 py-12 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-soft-black" />
                        <p className="text-sm font-medium text-soft-black mt-4">Подбираю вариант для вашего пространства…</p>
                        <p className="text-xs text-muted-gray mt-2">Сейчас соберу 3D-превью, затем открою результат.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {OPTIONS.map(option => (
                            <button
                                key={option.value}
                                onClick={() => void handleSelect(option.value)}
                                className={[
                                    'p-6 rounded-2xl border transition-all duration-300',
                                    'active:scale-[0.98] hover:border-soft-black/30',
                                    selections.mood === option.value
                                        ? 'border-soft-black/50'
                                        : 'border-stone-beige/50',
                                ].join(' ')}
                            >
                                <div className={`w-12 h-12 rounded-full ${option.color} mx-auto mb-3`} />
                                <div className="text-base font-medium text-soft-black text-center">{option.label}</div>
                            </button>
                        ))}
                    </div>
                )}

                <button
                    onClick={prevStep}
                    disabled={isGenerating}
                    className="text-sm text-muted-gray hover:text-soft-black transition-colors mx-auto block"
                >
                    ← Назад
                </button>

                {error && (
                    <p className="text-sm text-red-500 text-center max-w-sm mx-auto">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
};
