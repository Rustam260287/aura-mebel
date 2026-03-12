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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(245,242,237,0.98)_44%,_rgba(239,233,224,1)_100%)] animate-presence-enter">
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/70 to-transparent pointer-events-none" />
            <div className="absolute top-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-stone-beige/30 bg-white/88 px-4 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.06)] backdrop-blur-md">
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
