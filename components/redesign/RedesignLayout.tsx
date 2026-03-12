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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(246,242,236,0.98)_42%,_rgba(238,231,221,1)_100%)] animate-presence-enter">
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/70 to-transparent pointer-events-none" />
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
