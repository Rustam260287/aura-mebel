import React from 'react';
import { useRouter } from 'next/router';
import { useWizard } from '../../contexts/WizardContext';
import { Button } from '../Button';

export const StepResult: React.FC = () => {
    const router = useRouter();
    const { result, resetWizard } = useWizard();

    if (!result) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-muted-gray">Результат не получен</p>
            </div>
        );
    }

    const handleOpenViewer = () => {
        // Navigate to Object Detail with the selected model
        // For now, we'll simulate by going to objects page
        // In real implementation, you'd open 3D viewer with model_key and scale
        router.push(`/objects?model=${result.model_key}&scale=${result.scale}`);
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full space-y-8 text-center">
                <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full bg-soft-black/5 mx-auto flex items-center justify-center">
                        <svg className="w-8 h-8 text-soft-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-medium text-soft-black">Готово</h2>

                    <div className="text-sm text-muted-gray space-y-1">
                        <p>Модель: <span className="font-mono text-soft-black">{result.model_key}</span></p>
                        <p>Масштаб: <span className="font-mono text-soft-black">{result.scale.toFixed(2)}</span></p>
                    </div>
                </div>

                <div className="space-y-3">
                    <Button
                        onClick={handleOpenViewer}
                        size="lg"
                        variant="primary"
                        className="w-full rounded-2xl bg-soft-black text-white hover:bg-black"
                    >
                        Посмотреть
                    </Button>

                    <button
                        onClick={resetWizard}
                        className="text-sm text-muted-gray hover:text-soft-black transition-colors"
                    >
                        Начать заново
                    </button>
                </div>
            </div>
        </div>
    );
};
