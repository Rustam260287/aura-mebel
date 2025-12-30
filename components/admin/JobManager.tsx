
'use client'

import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon, PlayIcon, CheckCircleIcon, ExclamationTriangleIcon, PauseIcon } from '@heroicons/react/24/outline';
import { getAuth } from 'firebase/auth';

export const JobManager = () => {
  const [activeJob, setActiveJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isRunningRef = useRef(false);

  const getAuthToken = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('Пользователь не авторизован');
    return user.getIdToken();
  };

  const processNextBatch = async (jobId: string) => {
      if (!isRunningRef.current) return;

      try {
          const token = await getAuthToken();
	          const res = await fetch('/api/admin/jobs/worker', {
	              method: 'POST',
	              headers: {
	                  'Content-Type': 'application/json',
	                  'Authorization': `Bearer ${token}`,
	              },
	              body: JSON.stringify({ jobId })
	          });
          
          if (!res.ok) {
              const text = await res.text();
              throw new Error(`Server error ${res.status}: ${text}`);
          }

          const data = await res.json();
          
          if (data.status === 'processing') {
              setActiveJob((prev: any) => ({ ...prev, processedItems: data.processed, status: 'processing' }));
              setTimeout(() => processNextBatch(jobId), 1000);
          } else if (data.status === 'completed') {
              setActiveJob((prev: any) => ({ ...prev, processedItems: prev.totalItems, status: 'completed' }));
              setIsLoading(false);
              isRunningRef.current = false;
          }
      } catch (e: any) {
          console.error("Worker failed:", e);
          const message = e?.message || "Ошибка соединения";
          setErrorMsg(message);

          // Если это ошибка прав/авторизации — не зацикливаемся
          if (String(message).includes('403') || String(message).toLowerCase().includes('forbidden') || String(message).toLowerCase().includes('авториз')) {
              isRunningRef.current = false;
              setIsLoading(false);
              return;
          }

          setIsLoading(false);
          setTimeout(() => processNextBatch(jobId), 5000);
      }
  };

  const startJob = async (type: 'bulk_ai_specs') => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
          const token = await getAuthToken();
          const res = await fetch('/api/admin/jobs/create', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ type })
          });
          
          if (!res.ok) {
              const text = await res.text();
              throw new Error(`Server error ${res.status}: ${text}`);
          }
          
          const job = await res.json();
          
          if (job.jobId) {
              setActiveJob(job);
              isRunningRef.current = true;
              processNextBatch(job.jobId);
          }
      } catch (e: any) {
          const message = e?.message || 'Неизвестная ошибка';
          setErrorMsg(message);
          alert("Не удалось создать задачу: " + message);
          setIsLoading(false);
      }
  };

  const stopJob = () => {
      isRunningRef.current = false;
      setIsLoading(false);
  };

  const resumeJob = () => {
      if (activeJob) {
          setIsLoading(true);
          isRunningRef.current = true;
          processNextBatch(activeJob.jobId);
      }
  };

  if (!activeJob && !isLoading) {
      return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Автоматизация объектов</h3>
            <p className="text-sm text-gray-500 mb-4">
                Помогает привести карточки объектов к единому аккуратному виду, без лишней лексики и давления.
            </p>
            <div className="flex gap-4 flex-wrap">
                <button 
                    onClick={() => startJob('bulk_ai_specs')}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all font-bold text-sm shadow-md hover:shadow-lg"
                >
                    <SparklesIcon className="w-5 h-5" />
                    Заполнить характеристики (AI)
                </button>
            </div>

            {errorMsg && (
                <div className="flex items-center gap-2 text-xs text-red-500 mt-4 bg-red-50 p-2 rounded">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    {errorMsg}
                </div>
            )}
        </div>
      );
  }

  const progress = activeJob ? Math.round((activeJob.processedItems / activeJob.totalItems) * 100) : 0;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-gray-800">
                    {activeJob?.status === 'completed' ? 'Готово!' : 'AI работает...'}
                </h3>
                {isLoading && activeJob?.status !== 'completed' && (
                    <button onClick={stopJob} className="p-1 rounded-full hover:bg-gray-100" title="Пауза">
                        <PauseIcon className="w-5 h-5 text-gray-500" />
                    </button>
                )}
                {!isLoading && activeJob?.status !== 'completed' && (
                    <button onClick={resumeJob} className="p-1 rounded-full hover:bg-gray-100" title="Продолжить">
                        <PlayIcon className="w-5 h-5 text-green-600" />
                    </button>
                )}
            </div>
            
            {activeJob?.status === 'completed' ? (
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
            ) : (
                <div className="text-sm font-mono text-gray-500">
                    {activeJob?.processedItems} / {activeJob?.totalItems}
                </div>
            )}
        </div>

        <div className="w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden relative">
            <div 
                className={`h-full transition-all duration-500 ease-out ${errorMsg ? 'bg-red-500' : 'bg-brand-brown'}`}
                style={{ width: `${progress}%` }}
            />
        </div>
        
        {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-red-500 mt-2 bg-red-50 p-2 rounded">
                <ExclamationTriangleIcon className="w-4 h-4" />
                {errorMsg}. Повторная попытка через 5 сек...
            </div>
        )}

        {activeJob?.status === 'completed' && (
            <button 
                onClick={() => { setActiveJob(null); setIsLoading(false); setErrorMsg(null); }}
                className="mt-4 text-sm text-brand-brown hover:underline"
            >
                Скрыть и начать заново
            </button>
        )}
    </div>
  );
};
