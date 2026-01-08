import React, { useEffect } from 'react';
import { useRedesign } from '../../contexts/RedesignContext';

export const StepProcessing: React.FC = () => {
    const { progress, input } = useRedesign();

    return (
        <div className="h-full flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full space-y-8 text-center">
                {/* Room preview (blurred during processing) */}
                {input.roomImageUrl && (
                    <div className="relative aspect-video rounded-2xl overflow-hidden">
                        <img
                            src={input.roomImageUrl}
                            alt="Processing"
                            className="w-full h-full object-cover blur-sm opacity-50"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soft-black" />
                        </div>
                    </div>
                )}

                {/* Progress info */}
                <div className="space-y-4">
                    <h2 className="text-xl font-medium text-soft-black">
                        {progress?.message || 'Обрабатываю...'}
                    </h2>

                    {/* Progress bar */}
                    <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-soft-black transition-all duration-500 ease-out"
                            style={{ width: `${progress?.percent || 0}%` }}
                        />
                    </div>

                    <p className="text-sm text-muted-gray">
                        Это может занять несколько секунд
                    </p>
                </div>
            </div>
        </div>
    );
};
