import React from 'react';
import { useRedesign } from '../../contexts/RedesignContext';
import { StepUpload } from './StepUpload';
import { StepStyle } from './StepStyle';
import { StepProcessing } from './StepProcessing';
import { StepResultRedesign } from './StepResultRedesign';

export const RedesignLayout: React.FC = () => {
    const { currentStep, isProcessing, result } = useRedesign();

    // Show processing overlay while generating
    const showProcessing = isProcessing;
    // Show result when we have it
    const showResult = result !== null && !isProcessing;

    return (
        <div className="dark fixed inset-0 bg-aura-dark-base overflow-hidden z-50 animate-presence-enter">
            {/* Step container with soft transitions */}
            <div className="absolute inset-0 transition-opacity duration-700 ease-out">
                {showProcessing ? (
                    <StepProcessing />
                ) : showResult ? (
                    <StepResultRedesign />
                ) : currentStep === 0 ? (
                    <StepUpload />
                ) : (
                    <StepStyle />
                )}
            </div>
        </div>
    );
};
