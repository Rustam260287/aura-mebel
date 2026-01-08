import React from 'react';
import { useWizard } from '../../contexts/WizardContext';
import { StepScale } from './StepScale';
import { StepMood } from './StepMood';
import { StepContext } from './StepContext';
import { StepResult } from './StepResult';

export const WizardLayout: React.FC = () => {
    const { currentStep } = useWizard();

    return (
        <div className="dark fixed inset-0 bg-aura-dark-base overflow-hidden z-50 animate-presence-enter">
            {/* Soft transition container */}
            <div className="absolute inset-0 transition-opacity duration-700 ease-out">
                {currentStep === 0 && <StepScale />}
                {currentStep === 1 && <StepMood />}
                {currentStep === 2 && <StepContext />}
                {currentStep === 3 && <StepResult />}
            </div>
        </div>
    );
};
