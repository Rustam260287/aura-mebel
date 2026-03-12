import React from 'react';
import { useRedesign } from '../../contexts/RedesignContext';

const FURNITURE_OPTIONS = [
    { value: 'sofa', label: 'Диван' },
    { value: 'armchair', label: 'Кресло' },
    { value: 'table', label: 'Стол' },
    { value: 'chair', label: 'Стул' },
    { value: 'bed', label: 'Кровать' },
];

const STYLE_OPTIONS = [
    { value: 'minimal', label: 'Минимализм', color: 'bg-stone-100' },
    { value: 'cozy', label: 'Уютный', color: 'bg-amber-50' },
    { value: 'modern', label: 'Современный', color: 'bg-slate-100' },
    { value: 'classic', label: 'Классика', color: 'bg-stone-200' },
];

const MOOD_OPTIONS = [
    { value: 'calm', label: 'Спокойный' },
    { value: 'warm', label: 'Тёплый' },
    { value: 'fresh', label: 'Свежий' },
    { value: 'dramatic', label: 'Драматичный' },
];

export const StepStyle: React.FC = () => {
    const { input, setInput, prevStep, submitRedesign, isProcessing, error } = useRedesign();

    const handleSubmit = async () => {
        await submitRedesign();
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-medium text-soft-black">Какой ориентир собрать</h2>
                    <p className="text-sm text-muted-gray">Выберите мебель, стиль и настроение будущего варианта</p>
                </div>

                {/* Furniture type */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-soft-black">Тип мебели</label>
                    <div className="flex flex-wrap gap-2">
                        {FURNITURE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setInput('object_type', opt.value)}
                                className={[
                                    'px-4 py-2 rounded-full text-sm transition-all',
                                    input.object_type === opt.value
                                        ? 'bg-soft-black text-white'
                                        : 'bg-white border border-stone-beige/50 text-soft-black hover:border-soft-black/30',
                                ].join(' ')}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Style */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-soft-black">Стиль</label>
                    <div className="grid grid-cols-2 gap-2">
                        {STYLE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setInput('style', opt.value)}
                                className={[
                                    'p-4 rounded-xl border transition-all',
                                    input.style === opt.value
                                        ? 'border-soft-black/50'
                                        : 'border-stone-beige/50 hover:border-soft-black/30',
                                ].join(' ')}
                            >
                                <div className={`w-8 h-8 rounded-full ${opt.color} mx-auto mb-2`} />
                                <div className="text-sm font-medium text-soft-black">{opt.label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mood */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-soft-black">Настроение</label>
                    <div className="flex flex-wrap gap-2">
                        {MOOD_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setInput('mood', opt.value)}
                                className={[
                                    'px-4 py-2 rounded-full text-sm transition-all',
                                    input.mood === opt.value
                                        ? 'bg-soft-black text-white'
                                        : 'bg-white border border-stone-beige/50 text-soft-black hover:border-soft-black/30',
                                ].join(' ')}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <button
                        onClick={prevStep}
                        disabled={isProcessing}
                        className="flex-1 py-3 rounded-xl border border-stone-beige/50 text-soft-black hover:bg-stone-100 transition-colors disabled:opacity-50"
                    >
                        Назад
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isProcessing}
                        className="flex-1 py-3 rounded-xl bg-soft-black text-white hover:bg-black transition-colors disabled:opacity-50"
                    >
                        {isProcessing ? 'Собираю...' : 'Создать визуализацию'}
                    </button>
                </div>

                {error && (
                    <p className="text-sm text-red-500 text-center max-w-sm mx-auto">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
};
