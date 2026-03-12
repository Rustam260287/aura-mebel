import React from 'react';
import { useWizard } from '../../contexts/WizardContext';
import { StepObjectType } from './StepObjectType';
import { StepScale } from './StepScale';
import { StepMood } from './StepMood';
import { StepResult } from './StepResult';

export const WizardLayout: React.FC = () => {
    const { currentStep } = useWizard();
    const totalSteps = 3;
    const activeStep = Math.min(currentStep, totalSteps - 1);

    return (
        <div className="dark fixed inset-0 bg-aura-dark-base overflow-hidden z-50 animate-presence-enter">
            <div className="absolute top-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-stone-beige/20 bg-white/70 px-4 py-2 backdrop-blur-md">
                {Array.from({ length: totalSteps }).map((_, index) => (
                    <span
                        key={index}
                        className={[
                            'h-1.5 rounded-full transition-all duration-300',
                            index === activeStep ? 'w-8 bg-soft-black' : 'w-1.5 bg-soft-black/20',
                        ].join(' ')}
                    />
                ))}
            </div>

            {/* Soft transition container */}
            <div className="absolute inset-0 transition-opacity duration-700 ease-out">
                {currentStep === 0 && <StepObjectType />}
                {currentStep === 1 && <StepScale />}
                {currentStep === 2 && <StepMood />}
                {currentStep === 3 && <StepResult />}
            </div>
        </div>
    );
};
