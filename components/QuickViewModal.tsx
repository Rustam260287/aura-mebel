
import React, { memo } from 'react';
import type { Product } from '../types';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { XMarkIcon } from './Icons';
import { useCartDispatch } from '../contexts/CartContext'; // ИСПРАВЛЕНО
import Image from 'next/image';

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
  onViewDetails: (productId: string) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = memo(({ product, onClose, onViewDetails }) => {
  const { addToCart } = useCartDispatch(); // ИСПРАВЛЕНО

  const handleAddToCart = () => {
    addToCart(product);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl m-4 grid grid-cols-1 md:grid-cols-2 gap-8 p-8 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="relative aspect-square">
          <Image src={(product.imageUrls && product.imageUrls[0]) || '/placeholder.svg'} alt={product.name} className="object-cover rounded-lg" fill sizes="(max-width: 768px) 90vw, 40vw" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-3xl font-serif text-brand-brown mb-3">{product.name}</h2>
          <div className="flex items-center mb-4">
            <StarRating rating={product.rating || 0} />
            <span className="ml-2 text-sm text-gray-500">({product.reviews?.length || 0} отзывов)</span>
          </div>
          <p className="text-3xl font-serif text-brand-charcoal mb-6">{product.price.toLocaleString('ru-RU')} ₽</p>
          <p className="text-gray-600 mb-6 leading-relaxed line-clamp-4">{product.description}</p>
          
          <div className="mt-auto space-y-4">
            <Button size="lg" className="w-full" onClick={handleAddToCart}>Добавить в корзину</Button>
            <Button variant="outline" className="w-full" onClick={() => onViewDetails(product.id)}>Посмотреть детали</Button>
          </div>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"><XMarkIcon className="w-6 h-6" /></button>
      </div>
    </div>
  );
});

QuickViewModal.displayName = 'QuickViewModal';
