import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useWizard } from '../../contexts/WizardContext';
import { useSaved } from '../../contexts/SavedContext';
import { useToast } from '../../contexts/ToastContext';
import { buildSavedWizardSignature } from '../../lib/saved/types';
import { Button } from '../Button';
import { WizardLivePreview } from './WizardLivePreview';
import type { ObjectPublic } from '../../types';

const OBJECT_TYPE_LABELS: Record<string, string> = {
    sofa: 'диван',
    armchair: 'кресло',
    bed: 'кровать',
    table: 'стол',
    chair: 'стул',
    shelf: 'стеллаж',
};

const PRESENCE_LABELS: Record<string, string> = {
    compact: 'компактным',
    balanced: 'стандартным',
    dominant: 'просторным',
};

const PRESENCE_DISPLAY_LABELS: Record<string, string> = {
    compact: 'Компактный',
    balanced: 'Стандартный',
    dominant: 'Просторный',
};

const MOOD_LABELS: Record<string, string> = {
    calm: 'спокойным',
    soft: 'мягким',
    expressive: 'выразительным',
    strict: 'строгим',
};

export const StepResult: React.FC = () => {
    const router = useRouter();
    const { result, resetWizard, selections } = useWizard();
    const { saveWizardConfig, isWizardConfigSaved } = useSaved();
    const { addToast } = useToast();
    const [selectedObject, setSelectedObject] = useState<ObjectPublic | null>(null);
    const [isLoadingObject, setIsLoadingObject] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const objectId = result?.object_id;
    const runtimeScale = result?.scale ? result.scale.toFixed(2) : null;
    const sizeLabel = selections.presence ? PRESENCE_DISPLAY_LABELS[selections.presence] || 'Стандартный' : 'Стандартный';

    const handleOpenViewer = () => {
        if (!objectId) return;
        const query = runtimeScale
            ? `?source=wizard&wizardScale=${encodeURIComponent(runtimeScale)}`
            : '?source=wizard';
        router.push(`/objects/${objectId}${query}`);
    };

    useEffect(() => {
        if (!objectId) {
            setSelectedObject(null);
            setLoadError(null);
            setIsLoadingObject(false);
            return;
        }

        let cancelled = false;

        const loadObject = async () => {
            setIsLoadingObject(true);
            setLoadError(null);

            try {
                const response = await fetch(`/api/objects/${objectId}`);
                if (!response.ok) {
                    throw new Error('Failed to load selected object');
                }

                const object: ObjectPublic = await response.json();
                if (!cancelled) {
                    setSelectedObject(object);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('StepResult object preview error:', error);
                    setSelectedObject(null);
                    setLoadError('Не удалось загрузить превью. Но сам вариант можно открыть.');
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingObject(false);
                }
            }
        };

        void loadObject();

        return () => {
            cancelled = true;
        };
    }, [objectId]);

    const summaryText = useMemo(() => {
        const objectType = selections.object_type ? OBJECT_TYPE_LABELS[selections.object_type] || 'объект' : 'объект';
        const mood = selections.mood ? MOOD_LABELS[selections.mood] || 'спокойным' : 'спокойным';
        const presence = selections.presence ? PRESENCE_LABELS[selections.presence] || 'сбалансированным' : 'сбалансированным';

        return `Мы подобрали ${objectType}, который будет ощущаться ${mood} и ${presence} в вашем пространстве.`;
    }, [selections.mood, selections.object_type, selections.presence]);

    const savedSignature = useMemo(() => {
        if (!result?.object_id || !selections.object_type || !selections.presence || !selections.mood) {
            return null;
        }

        return buildSavedWizardSignature({
            objectId: result.object_id,
            objectName: selectedObject?.name || 'Объект из коллекции Aura',
            objectImageUrl: selectedObject?.imageUrls?.[0],
            objectType: selections.object_type,
            mood: selections.mood,
            presence: selections.presence,
            scale: result.scale,
            summary: summaryText,
        });
    }, [result, selections.mood, selections.object_type, selections.presence, selectedObject?.imageUrls, selectedObject?.name, summaryText]);

    const isSavedConfig = savedSignature ? isWizardConfigSaved(savedSignature) : false;

    const handleSave = () => {
        if (!result?.object_id || !selections.object_type || !selections.presence || !selections.mood) return;

        const response = saveWizardConfig({
            objectId: result.object_id,
            objectName: selectedObject?.name || 'Объект из коллекции Aura',
            objectImageUrl: selectedObject?.imageUrls?.[0],
            objectType: selections.object_type,
            mood: selections.mood,
            presence: selections.presence,
            scale: result.scale,
            summary: summaryText,
        });

        addToast(response.isNew ? 'Конфигурация сохранена' : 'Конфигурация уже сохранена', 'success', 2200);
    };

    if (!result) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-muted-gray">Результат не получен</p>
            </div>
        );
    }

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

                    <div className="text-sm text-muted-gray space-y-2">
                        <p>{summaryText}</p>
                        <p>Следующий шаг: откройте вариант и посмотрите его в своём интерьере.</p>
                    </div>
                </div>

                <div className="rounded-[28px] border border-stone-beige/40 bg-white/80 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                    <div className="aspect-[4/3] bg-stone-beige/10 flex items-center justify-center overflow-hidden">
                        {selectedObject ? (
                            <WizardLivePreview
                                glbUrl={selectedObject.modelGlbUrl}
                                posterUrl={selectedObject.imageUrls?.[0]}
                                objectId={selectedObject.id}
                                objectName={selectedObject.name}
                                scale={result.scale}
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-gray">
                                {isLoadingObject ? (
                                    <>
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-soft-black" />
                                        <span className="text-sm">Подготавливаю вариант…</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-4xl">□</div>
                                        <span className="text-sm">Вариант готов к просмотру</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-5 text-left space-y-2">
                        <div className="text-xs uppercase tracking-[0.16em] text-muted-gray">
                            Подобранный вариант
                        </div>
                        <div className="text-xl font-medium text-soft-black">
                            {selectedObject?.name || 'Объект из коллекции Aura'}
                        </div>
                        <div className="text-sm text-muted-gray">
                            {loadError || selectedObject?.description || 'Покрутите 3D прямо здесь, затем откройте объект для AR-примерки.'}
                        </div>
                        {runtimeScale && (
                            <div className="text-xs uppercase tracking-[0.14em] text-muted-gray pt-2">
                                Размер в примерке · {sizeLabel}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <Button
                        onClick={handleOpenViewer}
                        size="lg"
                        variant="primary"
                        className="w-full rounded-2xl bg-soft-black text-white hover:bg-black"
                    >
                        Посмотреть в интерьере
                    </Button>

                    <Button
                        onClick={handleSave}
                        size="md"
                        variant="secondary"
                        className="w-full rounded-2xl"
                        disabled={!result?.object_id}
                    >
                        {isSavedConfig ? 'Конфигурация сохранена' : 'Сохранить конфигурацию'}
                    </Button>

                    <button
                        onClick={resetWizard}
                        className="text-sm text-muted-gray hover:text-soft-black transition-colors"
                    >
                        Изменить выбор
                    </button>
                </div>
            </div>
        </div>
    );
};
