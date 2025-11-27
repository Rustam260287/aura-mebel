
import React, { memo } from 'react';
import { Button } from './Button';
import { XMarkIcon, ArrowPathIcon } from './Icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: React.ReactNode; // Сообщение теперь опционально
  children?: React.ReactNode; // Добавляем поддержку дочерних элементов
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  confirmButtonVariant?: 'primary' | 'danger'; // Вариант для цвета кнопки
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = memo(({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  children, // Получаем дочерние элементы
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  isLoading = false,
  confirmButtonVariant = 'danger',
}) => {
  if (!isOpen) return null;

  const confirmButtonClasses = confirmButtonVariant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white'
    : 'bg-brand-brown hover:bg-brand-brown-dark focus:ring-brand-brown text-white';


  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-subtle-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-6 border-b">
          <h2 id="confirmation-title" className="text-xl font-serif text-brand-brown">{title}</h2>
          <Button variant="ghost" onClick={onClose} className="p-2 -mr-2" aria-label="Закрыть">
            <XMarkIcon className="w-6 h-6" />
          </Button>
        </header>
        <div className="p-6">
          {/* Если есть children, показываем их. Иначе - показываем message. */}
          {children || <p className="text-brand-charcoal">{message}</p>}
        </div>
        <footer className="p-6 bg-gray-50 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            type="button"
            className={confirmButtonClasses}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                <span>Обработка...</span>
              </>
            ) : (
              confirmText
            )}
          </Button>
        </footer>
      </div>
    </div>
  );
});

ConfirmationModal.displayName = 'ConfirmationModal';
