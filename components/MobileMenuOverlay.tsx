'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export const MobileMenuOverlay = ({
  open,
  onClose,
  onObjects,
  onWizard,
  onRedesign,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onObjects: () => void;
  onWizard: () => void;
  onRedesign: () => void;
  onSaved: () => void;
}) => {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-menuOverlay bg-warm-white/98 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-full bg-white shadow-soft flex items-center justify-center text-soft-black"
              aria-label="Закрыть меню"
              type="button"
            >
              ✕
            </button>
          </div>

          <div className="h-full flex flex-col justify-center px-6">
            <div className="max-w-sm mx-auto w-full space-y-3">
              <button
                onClick={onObjects}
                className="w-full text-left rounded-3xl bg-white px-6 py-5 shadow-soft border border-stone-beige/30"
                type="button"
              >
                <div className="text-base font-medium text-soft-black">Готовая мебель</div>
                <div className="mt-1 text-sm text-muted-gray">Открыть коллекцию и посмотреть объект в интерьере</div>
              </button>

              <button
                onClick={onWizard}
                className="w-full text-left rounded-3xl bg-white px-6 py-5 shadow-soft border border-stone-beige/30"
                type="button"
              >
                <div className="text-base font-medium text-soft-black">Создать свою мебель</div>
                <div className="mt-1 text-sm text-muted-gray">Спокойный мастер выбора без технички и цен</div>
              </button>

              <button
                onClick={onRedesign}
                className="w-full text-left rounded-3xl bg-white px-6 py-5 shadow-soft border border-stone-beige/30"
                type="button"
              >
                <div className="text-base font-medium text-soft-black">AI-редизайн комнаты</div>
                <div className="mt-1 text-sm text-muted-gray">Собрать визуальный ориентир по фото комнаты</div>
              </button>

              <button
                onClick={onSaved}
                className="w-full text-left rounded-3xl bg-white px-6 py-5 shadow-soft border border-stone-beige/30"
                type="button"
              >
                <div className="text-base font-medium text-soft-black">Saved</div>
                <div className="mt-1 text-sm text-muted-gray">Вернуться к сохранённым объектам и сценариям</div>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
