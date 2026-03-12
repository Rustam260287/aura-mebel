import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useRedesign } from '../../contexts/RedesignContext';
import { useSaved } from '../../contexts/SavedContext';
import { useToast } from '../../contexts/ToastContext';
import { buildSavedRedesignSignature } from '../../lib/saved/types';
import { Button } from '../Button';

const OBJECT_LABELS: Record<string, string> = {
    sofa: 'диваном',
    armchair: 'креслом',
    table: 'столом',
    chair: 'стулом',
    bed: 'кроватью',
};

const STYLE_LABELS: Record<string, string> = {
    minimal: 'минималистичным',
    cozy: 'более уютным',
    modern: 'современным',
    classic: 'классическим',
};

const MOOD_LABELS: Record<string, string> = {
    calm: 'спокойным',
    warm: 'тёплым',
    fresh: 'свежим',
    dramatic: 'более выразительным',
};

export const StepResultRedesign: React.FC = () => {
    const router = useRouter();
    const { result, resetRedesign, editRedesign, input } = useRedesign();
    const { saveRedesign, isRedesignSaved } = useSaved();
    const { addToast } = useToast();
    const [showBefore, setShowBefore] = useState(false);
    const selectedFurniture = result?.selectedFurniture;
    const targetObjectId = selectedFurniture?.id ?? null;
    const canOpenObject = Boolean(targetObjectId && targetObjectId !== 'demo');

    const handleOpenObject = () => {
        if (canOpenObject) {
            router.push(`/objects/${targetObjectId}?source=redesign`);
            return;
        }

        router.push('/objects');
    };

    const objectLabel = OBJECT_LABELS[input.object_type || 'sofa'] || 'объектом';
    const styleLabel = STYLE_LABELS[input.style || 'minimal'] || 'спокойным';
    const moodLabel = MOOD_LABELS[input.mood || 'calm'] || 'спокойным';
    const summaryText = `Мы собрали ориентир для комнаты с ${objectLabel}, который делает пространство ${styleLabel} и ${moodLabel}.`;
    const savedSignature = result ? buildSavedRedesignSignature({
        objectId: canOpenObject ? targetObjectId || undefined : undefined,
        objectName: selectedFurniture?.name || 'Мебель из интерьера',
        objectImageUrl: selectedFurniture?.imageUrl,
        objectType: input.object_type || 'sofa',
        style: input.style || 'minimal',
        mood: input.mood || 'calm',
        summary: summaryText,
        beforeImageUrl: result.before,
        afterImageUrl: result.after,
    }) : null;
    const isSavedResult = savedSignature ? isRedesignSaved(savedSignature) : false;

    if (!result || !selectedFurniture) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-muted-gray">Результат не получен</p>
            </div>
        );
    }

    const helperText = selectedFurniture.has3D
        ? 'Откройте объект отдельно, чтобы посмотреть 3D и примерить его в интерьере.'
        : 'Откройте объект отдельно, чтобы перейти к деталям и продолжить исследование.';
    const visualChanged = result.after !== result.before;
    const isFallbackResult = result.generationStatus === 'fallback' || !visualChanged;
    const handleSave = () => {
        if (!result || !selectedFurniture) return;

        const response = saveRedesign({
            objectId: canOpenObject ? targetObjectId || undefined : undefined,
            objectName: selectedFurniture.name,
            objectImageUrl: selectedFurniture.imageUrl,
            objectType: input.object_type || 'sofa',
            style: input.style || 'minimal',
            mood: input.mood || 'calm',
            summary: summaryText,
            beforeImageUrl: result.before,
            afterImageUrl: result.after,
        });

        addToast(response.isNew ? 'AI-редизайн сохранён' : 'AI-редизайн уже сохранён', 'success', 2200);
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-2xl w-full space-y-5">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-medium text-soft-black">
                        {isFallbackResult ? 'Ориентир готов' : 'Визуализация готова'}
                    </h2>
                    <p className="text-sm text-muted-gray max-w-xl mx-auto">{summaryText}</p>
                </div>

                {result.generationNote && (
                    <div className="rounded-2xl border border-stone-beige/40 bg-white/82 px-4 py-3 text-sm text-soft-black shadow-sm">
                        {result.generationNote}
                    </div>
                )}

                <div className="flex justify-center">
                    <div className="inline-flex rounded-full bg-white border border-stone-beige/40 p-1 shadow-sm">
                        <button
                            onClick={() => setShowBefore(false)}
                            className={[
                                'px-4 py-2 rounded-full text-sm transition-colors',
                                !showBefore ? 'bg-soft-black text-white' : 'text-muted-gray hover:text-soft-black',
                            ].join(' ')}
                        >
                            После
                        </button>
                        <button
                            onClick={() => setShowBefore(true)}
                            className={[
                                'px-4 py-2 rounded-full text-sm transition-colors',
                                showBefore ? 'bg-soft-black text-white' : 'text-muted-gray hover:text-soft-black',
                            ].join(' ')}
                        >
                            До
                        </button>
                    </div>
                </div>

                <div className="relative aspect-video rounded-[28px] overflow-hidden bg-stone-100 shadow-[0_24px_80px_rgba(0,0,0,0.10)]">
                    <img
                        src={showBefore ? result.before : result.after}
                        alt={showBefore ? 'Исходная комната' : 'Визуализированная комната'}
                        className="w-full h-full object-cover"
                    />

                    <div className="absolute top-4 left-4 flex gap-2">
                        <div className="px-3 py-1.5 bg-white/92 backdrop-blur-sm rounded-full text-xs font-medium text-soft-black">
                            {showBefore ? 'До' : 'После'}
                        </div>
                        {!showBefore && result.currentPreset && (
                            <div className="px-3 py-1.5 bg-white/92 backdrop-blur-sm rounded-full text-xs font-medium text-muted-gray">
                                {result.currentPreset === 'creative'
                                    ? 'Более смелый вариант'
                                    : result.currentPreset === 'balanced'
                                        ? 'Сбалансированный вариант'
                                        : 'Мягкий вариант'}
                            </div>
                        )}
                    </div>
                </div>

                {!visualChanged && (
                    <div className="text-sm text-muted-gray text-center px-4">
                        Визуализация получилась очень близкой к исходному фото. Можно изменить стиль или сразу перейти к подобранной мебели.
                    </div>
                )}

                <div className="rounded-[28px] bg-white border border-stone-beige/30 p-4 md:p-5 shadow-sm">
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-gray mb-3">
                        Мебель из этого интерьера
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 flex-shrink-0">
                            {selectedFurniture.imageUrl ? (
                                <img
                                    src={selectedFurniture.imageUrl}
                                    alt={selectedFurniture.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-gray text-xl">
                                    □
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-soft-black text-base truncate">
                                {selectedFurniture.name}
                            </p>
                            <p className="text-sm text-muted-gray mt-1">
                                {selectedFurniture.description || helperText}
                            </p>
                        </div>

                        {selectedFurniture.has3D && (
                            <span className="px-2.5 py-1 bg-stone-100 text-muted-gray text-xs rounded-full">
                                3D + AR
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={editRedesign}
                        className="flex-1 py-3 rounded-xl border border-stone-beige/50 text-soft-black hover:bg-stone-100 transition-colors text-sm"
                    >
                        Изменить стиль
                    </button>
                    <Button
                        onClick={handleOpenObject}
                        size="lg"
                        variant="primary"
                        className="flex-1 rounded-xl text-sm"
                    >
                        {canOpenObject ? 'Посмотреть в интерьере' : 'Открыть коллекцию'}
                    </Button>
                </div>

                <Button
                    onClick={handleSave}
                    size="md"
                    variant="secondary"
                    className="w-full rounded-xl"
                >
                    {isSavedResult ? 'AI-редизайн сохранён' : 'Сохранить AI-редизайн'}
                </Button>

                <button
                    onClick={resetRedesign}
                    className="w-full text-sm text-muted-gray hover:text-soft-black transition-colors"
                >
                    Начать заново
                </button>
            </div>
        </div>
    );
};
