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
    const { setSelection, nextStep, prevStep, selections } = useWizard();

    const handleSelect = (value: Mood) => {
        setSelection('mood', value);
        setTimeout(() => nextStep(), 300);
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-medium text-soft-black">Настроение</h2>
                    <p className="text-sm text-muted-gray">Какой характер вам ближе?</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {OPTIONS.map(option => (
                        <button
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
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

                <button
                    onClick={prevStep}
                    className="text-sm text-muted-gray hover:text-soft-black transition-colors mx-auto block"
                >
                    ← Назад
                </button>
            </div>
        </div>
    );
};
