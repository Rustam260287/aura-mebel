import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { RedesignInput, RedesignResult, RedesignProgress } from '../../lib/redesign/types';
import type { RoomAnalysis } from '../../lib/antigravity/types';

interface RedesignContextValue {
    currentStep: number;
    input: Partial<RedesignInput>;
    progress: RedesignProgress | null;
    result: RedesignResult | null;
    isProcessing: boolean;

    // Context Analysis
    roomAnalysis: RoomAnalysis | null;
    isAnalyzing: boolean;

    setRoomImage: (url: string) => void;
    setInput: (key: keyof RedesignInput, value: any) => void;
    nextStep: () => void;
    prevStep: () => void;
    submitRedesign: () => Promise<void>;
    resetRedesign: () => void;
}

const RedesignContext = createContext<RedesignContextValue | null>(null);

export const useRedesign = () => {
    const context = useContext(RedesignContext);
    if (!context) throw new Error('useRedesign must be used within RedesignProvider');
    return context;
};

export const RedesignProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [input, setInputState] = useState<Partial<RedesignInput>>({
        object_type: 'sofa',
        style: 'minimal',
        mood: 'calm',
    });
    const [progress, setProgress] = useState<RedesignProgress | null>(null);
    const [result, setResult] = useState<RedesignResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Analysis State
    const [roomAnalysis, setRoomAnalysis] = useState<RoomAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const analyzeRoom = useCallback(async (imageBase64: string) => {
        setIsAnalyzing(true);
        try {
            const response = await fetch('/api/analyze-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64 }),
            });

            if (response.ok) {
                const data = await response.json();
                setRoomAnalysis(data);
                console.log('Room Analysis:', data);

                // Auto-fill input based on analysis if confidence is high
                if (data.confidence > 0.6) {
                    setInputState(prev => ({
                        ...prev,
                        room_type: data.room_type !== 'unknown' ? data.room_type : prev.room_type,
                        // Could also map lighting/colors to mood here
                    }));
                }
            }
        } catch (error) {
            console.error('Failed to analyze room:', error);
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    const setRoomImage = useCallback((url: string) => {
        setInputState(prev => ({ ...prev, roomImageUrl: url }));
        // Trigger analysis if it looks like a base64 string
        if (url.startsWith('data:image')) {
            analyzeRoom(url);
        }
    }, [analyzeRoom]);

    const setInput = useCallback((key: keyof RedesignInput, value: any) => {
        setInputState(prev => ({ ...prev, [key]: value }));
    }, []);

    const nextStep = useCallback(() => {
        setCurrentStep(prev => prev + 1);
    }, []);

    const prevStep = useCallback(() => {
        setCurrentStep(prev => Math.max(0, prev - 1));
    }, []);

    const submitRedesign = useCallback(async () => {
        setIsProcessing(true);
        setProgress({ stage: 'analyzing', percent: 10, message: 'Анализирую композицию...' });

        try {
            setProgress({ stage: 'selecting', percent: 30, message: 'Подбираю мебель...' });

            const response = await fetch('/api/redesign/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input),
            });

            setProgress({ stage: 'generating', percent: 60, message: 'Генерирую визуализацию...' });

            if (!response.ok) throw new Error('Failed to generate redesign');

            const redesignResult: RedesignResult = await response.json();

            setProgress({ stage: 'done', percent: 100, message: 'Готово!' });
            setResult(redesignResult);
            nextStep();
        } catch (error) {
            console.error('Redesign error:', error);
            setProgress({ stage: 'error', percent: 0, message: 'Ошибка генерации' });
        } finally {
            setIsProcessing(false);
        }
    }, [input, nextStep]);

    const resetRedesign = useCallback(() => {
        setCurrentStep(0);
        setInputState({ object_type: 'sofa', style: 'minimal', mood: 'calm' });
        setResult(null);
        setProgress(null);
        setIsProcessing(false);
    }, []);

    const value: RedesignContextValue = {
        currentStep,
        input,
        progress,
        result,
        isProcessing,
        setRoomImage,
        setInput,
        nextStep,
        prevStep,
        submitRedesign,
        resetRedesign,

        roomAnalysis,
        isAnalyzing,
    };

    return <RedesignContext.Provider value={value}>{children}</RedesignContext.Provider>;
};
