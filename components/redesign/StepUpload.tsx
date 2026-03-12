import React, { useRef, useState } from 'react';
import { useRedesign } from '../../contexts/RedesignContext';

export const StepUpload: React.FC = () => {
    const { setRoomImage, nextStep, isAnalyzing, roomAnalysis } = useRedesign();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setPreview(dataUrl);
            setRoomImage(dataUrl);
            setIsUploading(false);
        };
        reader.onerror = () => {
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleContinue = () => {
        if (preview) {
            nextStep();
        }
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-medium text-soft-black">Ваше пространство</h2>
                    <p className="text-sm text-muted-gray">
                        Загрузите фото комнаты. Мы соберём визуальный ориентир и предложим подходящую мебель.
                    </p>
                </div>

                {preview ? (
                    <div className="space-y-4">
                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-stone-100 group">
                            <img src={preview} alt="Room preview" className="w-full h-full object-cover" />

                            {/* Analysis Overlay */}
                            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                {isAnalyzing && (
                                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-soft-black flex items-center gap-2 shadow-sm animate-fade-in">
                                        <div className="w-3 h-3 border-2 border-stone-400 border-t-soft-black rounded-full animate-spin" />
                                        Анализ комнаты...
                                    </div>
                                )}

                                {!isAnalyzing && roomAnalysis && (
                                    <>
                                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-soft-black shadow-sm animate-fade-in">
                                            Похоже на {roomAnalysis.room_type === 'living_room' ? 'гостиную' :
                                                roomAnalysis.room_type === 'bedroom' ? 'спальню' :
                                                    roomAnalysis.room_type === 'kitchen' ? 'кухню' :
                                                        roomAnalysis.room_type === 'office' ? 'кабинет' :
                                                            roomAnalysis.room_type === 'dining' ? 'столовую' : 'комнату'}
                                        </div>
                                        {roomAnalysis.lighting === 'natural' && (
                                            <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-soft-black shadow-sm animate-fade-in">
                                                Много естественного света
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setPreview(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                className="flex-1 py-3 rounded-xl border border-stone-beige/50 text-soft-black hover:bg-stone-100 transition-colors"
                            >
                                Другое фото
                            </button>
                            <button
                                onClick={handleContinue}
                                className="flex-1 py-3 rounded-xl bg-soft-black text-white hover:bg-black transition-colors"
                            >
                                Использовать это фото
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full aspect-video rounded-2xl border-2 border-dashed border-stone-beige/50 hover:border-soft-black/30 transition-colors flex flex-col items-center justify-center gap-3 bg-white/50"
                    >
                        {isUploading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-soft-black" />
                        ) : (
                            <>
                                <svg className="w-12 h-12 text-muted-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm text-muted-gray">Выбрать фото комнаты</span>
                            </>
                        )}
                    </button>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>
        </div>
    );
};
