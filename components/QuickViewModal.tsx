
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
    <div className="fixed inset-0 bg-brand-charcoal/80 backdrop-blur-sm z-[200] flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-4xl m-4 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden animate-scale-in relative" onClick={e => e.stopPropagation()}>
        <div className="relative aspect-[4/5] md:aspect-auto bg-[#F9F9F9]">
          <Image 
            src={(product.imageUrls && product.imageUrls[0]) || '/placeholder.svg'} 
            alt={product.name} 
            className="object-cover md:object-contain p-8 md:p-12" 
            fill 
            sizes="(max-width: 768px) 100vw, 50vw" 
          />
        </div>
        <div className="flex flex-col p-8 md:p-12">
            <div className="mb-2">
                 <span className="text-[10px] font-bold tracking-[0.2em] text-brand-terracotta uppercase">{product.category}</span>
            </div>
          <h2 className="text-2xl md:text-3xl font-serif text-brand-charcoal mb-4 leading-tight">{product.name}</h2>
          <div className="flex items-center mb-6">
            <StarRating rating={product.rating || 0} />
            <span className="ml-3 text-xs text-gray-400 border-b border-gray-200">{product.reviews?.length || 0} отзывов</span>
          </div>
          
          <div className="flex items-baseline gap-4 mb-6">
                <span className="text-3xl font-light text-brand-charcoal">
                    {product.price.toLocaleString('ru-RU')} ₽
                </span>
                {product.originalPrice && (
                    <span className="text-lg text-gray-300 line-through">
                        {product.originalPrice.toLocaleString('ru-RU')} ₽
                    </span>
                )}
           </div>

          <p className="text-brand-charcoal/70 mb-8 leading-loose font-light text-sm line-clamp-4">{product.description}</p>
          
          <div className="mt-auto space-y-3">
            <Button size="lg" className="w-full bg-brand-charcoal hover:bg-brand-brown shadow-lg shadow-brand-charcoal/10 uppercase text-xs font-bold tracking-widest" onClick={handleAddToCart}>Добавить в корзину</Button>
            <Button variant="outline" className="w-full border-gray-200 text-brand-charcoal hover:border-brand-charcoal uppercase text-xs font-bold tracking-widest" onClick={() => onViewDetails(product.id)}>Полная информация</Button>
          </div>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-brand-terracotta transition-colors p-2 rounded-full hover:bg-gray-50"><XMarkIcon className="w-6 h-6" /></button>
      </div>
    </div>
  );
});

QuickViewModal.displayName = 'QuickViewModal';
