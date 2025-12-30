'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export const MobileMenuOverlay = ({
  open,
  onClose,
  onCatalog,
  onSaved,
  onAbout,
}: {
  open: boolean;
  onClose: () => void;
  onCatalog: () => void;
  onSaved: () => void;
  onAbout: () => void;
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
          className="fixed inset-0 z-menuOverlay bg-warm-white"
          role="dialog"
          aria-modal="true"
        >
          <div className="h-full flex flex-col justify-center items-center gap-10 text-lg">
            <button onClick={onCatalog} className="text-soft-black" type="button">
              Галерея
            </button>

            <button onClick={onSaved} className="text-soft-black" type="button">
              Сохранено
            </button>

            <button onClick={onAbout} className="text-muted-gray" type="button">
              О проекте
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
