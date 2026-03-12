import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { WizardIntent, FittingResult } from '../lib/antigravity/types';

interface WizardContextValue {
    currentStep: number;
    selections: Partial<WizardIntent>;
    isGenerating: boolean;
    result: FittingResult | null;
    error: string | null;

    setSelection: (key: keyof WizardIntent, value: any) => void;
    nextStep: () => void;
    prevStep: () => void;
    submitWizard: (overrides?: Partial<WizardIntent>) => Promise<void>;
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
}

export const WizardProvider: React.FC<WizardProviderProps> = ({ children }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [selections, setSelections] = useState<Partial<WizardIntent>>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<FittingResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const setSelection = useCallback((key: keyof WizardIntent, value: any) => {
        setError(null);
        setSelections(prev => ({ ...prev, [key]: value }));
    }, []);

    const nextStep = useCallback(() => {
        setCurrentStep(prev => prev + 1);
    }, []);

    const prevStep = useCallback(() => {
        setCurrentStep(prev => Math.max(0, prev - 1));
    }, []);

    const submitWizard = useCallback(async (overrides?: Partial<WizardIntent>) => {
        setIsGenerating(true);
        setError(null);
        const payload = { ...selections, ...(overrides || {}) } as Partial<WizardIntent>;

        try {
            const response = await fetch('/api/wizard/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => ({ error: 'Failed to generate fitting' }));
                throw new Error(payload.error || 'Failed to generate fitting');
            }

            const fittingResult: FittingResult = await response.json();
            setResult(fittingResult);
            nextStep(); // Move to result step
        } catch (error) {
            console.error('Wizard error:', error);
            setResult(null);
            setError('Не получилось подобрать вариант. Попробуйте изменить выбор или повторить позже.');
        } finally {
            setIsGenerating(false);
        }
    }, [selections, nextStep]);

    const resetWizard = useCallback(() => {
        setCurrentStep(0);
        setSelections({});
        setResult(null);
        setIsGenerating(false);
        setError(null);
    }, []);

    const value: WizardContextValue = {
        currentStep,
        selections,
        isGenerating,
        result,
        error,
        setSelection,
        nextStep,
        prevStep,
        submitWizard,
        resetWizard,
    };

    return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
};
