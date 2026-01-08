import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { WizardIntent, FittingResult } from '../../lib/antigravity/types';

interface WizardContextValue {
    currentStep: number;
    selections: Partial<WizardIntent>;
    isGenerating: boolean;
    result: FittingResult | null;

    setSelection: (key: keyof WizardIntent, value: any) => void;
    nextStep: () => void;
    prevStep: () => void;
    submitWizard: () => Promise<void>;
    resetWizard: () => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export const useWizard = () => {
    const context = useContext(WizardContext);
    if (!context) throw new Error('useWizard must be used within WizardProvider');
    return context;
};

interface WizardProviderProps {
    children: ReactNode;
    objectType?: WizardIntent['object_type'];
}

export const WizardProvider: React.FC<WizardProviderProps> = ({ children, objectType = 'sofa' }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [selections, setSelections] = useState<Partial<WizardIntent>>({
        object_type: objectType,
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<FittingResult | null>(null);

    const setSelection = useCallback((key: keyof WizardIntent, value: any) => {
        setSelections(prev => ({ ...prev, [key]: value }));
    }, []);

    const nextStep = useCallback(() => {
        setCurrentStep(prev => prev + 1);
    }, []);

    const prevStep = useCallback(() => {
        setCurrentStep(prev => Math.max(0, prev - 1));
    }, []);

    const submitWizard = useCallback(async () => {
        setIsGenerating(true);

        try {
            const response = await fetch('/api/wizard/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selections),
            });

            if (!response.ok) throw new Error('Failed to generate fitting');

            const fittingResult: FittingResult = await response.json();
            setResult(fittingResult);
            nextStep(); // Move to result step
        } catch (error) {
            console.error('Wizard error:', error);
        } finally {
            setIsGenerating(false);
        }
    }, [selections, nextStep]);

    const resetWizard = useCallback(() => {
        setCurrentStep(0);
        setSelections({ object_type: objectType });
        setResult(null);
        setIsGenerating(false);
    }, [objectType]);

    const value: WizardContextValue = {
        currentStep,
        selections,
        isGenerating,
        result,
        setSelection,
        nextStep,
        prevStep,
        submitWizard,
        resetWizard,
    };

    return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
};
