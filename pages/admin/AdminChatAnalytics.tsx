import React, { useState } from 'react';
import type { ChatMessage, ChatAnalysisResult } from '../../types';
import { Button } from '../../components/Button';
import { SparklesIcon, ArrowPathIcon } from '../../components/Icons';
import { analyzeChatLogs } from '../../services/geminiService';

interface AdminChatAnalyticsProps {
  chatLogs: ChatMessage[][];
}

const AnalysisCard: React.FC<{ title: string; items: string[]; children?: React.ReactNode }> = ({ title, items, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-serif text-brand-brown mb-4">{title}</h3>
        {items.length > 0 ? (
            <ul className="list-disc list-inside space-y-2 text-brand-charcoal">
                {items.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        ) : (
            <p className="text-gray-500">Нет данных для отображения.</p>
        )}
        {children}
    </div>
);

export const AdminChatAnalytics: React.FC<AdminChatAnalyticsProps> = ({ chatLogs }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<ChatAnalysisResult | null>(null);

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await analyzeChatLogs(chatLogs);
            setAnalysisResult(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Произошла неизвестная ошибка.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-serif text-brand-brown">Аналитика чатов с ИИ-помощником</h1>
                <Button onClick={handleAnalyze} disabled={isLoading || chatLogs.length === 0}>
                    <SparklesIcon className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Анализ...' : 'Проанализировать разговоры'}
                </Button>
            </div>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                    <strong className="font-bold">Ошибка!</strong>
                    <span className="block sm:inline ml-2">{error}</span>
                </div>
            )}

            {!analysisResult && !isLoading && (
                <div className="text-center bg-white p-12 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold text-brand-charcoal">Готовы получить инсайты?</h2>
                    <p className="mt-2 text-gray-600">
                        {chatLogs.length > 0
                            ? `Накоплено ${chatLogs.length} диалогов. Нажмите на кнопку, чтобы ИИ проанализировал их и предоставил отчет.`
                            : `Пока нет сохраненных диалогов для анализа. Данные появятся после того, как клиенты пообщаются с AI-помощником.`}
                    </p>
                </div>
            )}

            {isLoading && (
                 <div className="text-center bg-white p-12 rounded-lg shadow-md">
                    <ArrowPathIcon className="w-12 h-12 text-brand-brown animate-spin mx-auto" />
                    <h2 className="text-2xl font-semibold text-brand-charcoal mt-4">Анализируем разговоры...</h2>
                    <p className="mt-2 text-gray-600">Это может занять некоторое время, в зависимости от количества данных.</p>
                </div>
            )}

            {analysisResult && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-subtle-fade-in">
                    <AnalysisCard title="Ключевые выводы и предложения" items={analysisResult.actionableInsights} />
                    <AnalysisCard title="Популярные темы" items={analysisResult.themes} />
                    <AnalysisCard title="Часто упоминаемые товары" items={analysisResult.mentionedProducts} />
                    <AnalysisCard title="Распространенные вопросы" items={analysisResult.commonQuestions} />
                </div>
            )}
        </div>
    );
};