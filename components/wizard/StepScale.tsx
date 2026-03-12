import React from 'react';
import { useWizard } from '../../contexts/WizardContext';
import type { Presence } from '../../lib/antigravity/types';

const OPTIONS: { value: Presence; label: string; description: string }[] = [
    { value: 'compact', label: 'Компактный', description: 'Спокойнее впишется и займёт меньше визуального внимания' },
    { value: 'balanced', label: 'Стандартный', description: 'Нейтральный баланс для большинства интерьеров' },
    { value: 'dominant', label: 'Просторный', description: 'Будет ощущаться заметнее и выразительнее' },
];

export const StepScale: React.FC = () => {
    const { setSelection, nextStep, prevStep, selections } = useWizard();

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
                    <h2 className="text-2xl font-medium text-soft-black">Размер</h2>
                    <p className="text-sm text-muted-gray">Каким он должен ощущаться в комнате?</p>
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
