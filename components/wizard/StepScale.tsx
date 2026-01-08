import React from 'react';
import { useWizard } from '../../contexts/WizardContext';
import type { Presence } from '../../lib/antigravity/types';

const OPTIONS: { value: Presence; label: string; description: string }[] = [
    { value: 'compact', label: 'Уютно', description: 'Компактное присутствие' },
    { value: 'balanced', label: 'Сбалансировано', description: 'Гармоничное присутствие' },
    { value: 'dominant', label: 'Просторно', description: 'Выразительное присутствие' },
];

export const StepScale: React.FC = () => {
    const { setSelection, nextStep, selections } = useWizard();

    const handleSelect = (value: Presence) => {
        setSelection('presence', value);
        // Auto-advance after short pause (calm UX)
        setTimeout(() => nextStep(), 300);
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full space-y-8">
                {/* Quiet heading */}
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-medium text-soft-black">Ощущение масштаба</h2>
                    <p className="text-sm text-muted-gray">Как объект будет чувствоваться в пространстве?</p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                    {OPTIONS.map(option => (
                        <button
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            className={[
                                'w-full p-6 rounded-2xl border transition-all duration-300',
                                'active:scale-[0.98] hover:border-soft-black/30',
                                selections.presence === option.value
                                    ? 'border-soft-black/50 bg-soft-black/5'
                                    : 'border-stone-beige/50 bg-white/50',
                            ].join(' ')}
                        >
                            <div className="text-left">
                                <div className="text-lg font-medium text-soft-black">{option.label}</div>
                                <div className="text-sm text-muted-gray mt-1">{option.description}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
