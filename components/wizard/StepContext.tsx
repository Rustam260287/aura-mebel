import React from 'react';
import { useWizard } from '../../contexts/WizardContext';
import type { SpaceContext } from '../../lib/antigravity/types';

const OPTIONS: { value: SpaceContext; label: string }[] = [
    { value: 'photo', label: 'У меня есть фото' },
    { value: 'ar', label: 'Посмотрю в AR' },
    { value: 'unknown', label: 'Просто исследую' },
];

export const StepContext: React.FC = () => {
    const { setSelection, submitWizard, prevStep, isGenerating } = useWizard();

    const handleSelect = async (value: SpaceContext) => {
        setSelection('space_context', value);
        // Submit after selection
        await submitWizard();
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-medium text-soft-black">Контекст</h2>
                    <p className="text-sm text-muted-gray">Как вы будете исследовать?</p>
                </div>

                {isGenerating ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-soft-black" />
                        <p className="text-sm text-muted-gray mt-4">Подбираю...</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {OPTIONS.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className="w-full p-5 rounded-2xl border border-stone-beige/50 bg-white/50 hover:border-soft-black/30 active:scale-[0.98] transition-all duration-300"
                                >
                                    <div className="text-base font-medium text-soft-black text-center">{option.label}</div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={prevStep}
                            className="text-sm text-muted-gray hover:text-soft-black transition-colors mx-auto block"
                        >
                            ← Назад
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
