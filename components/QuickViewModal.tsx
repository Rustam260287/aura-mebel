import React, { memo } from 'react';
import type { Product } from '../types';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { XMarkIcon } from './Icons';
import { useCart } from '../contexts/CartContext';

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
  onViewDetails: (productId: string) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = memo(({ product, onClose, onViewDetails }) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black z-10">
          <XMarkIcon className="w-7 h-7" />
        </button>
        
        <div className="md:w-1/2">
            <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover rounded-l-lg" />
        </div>
        
        <div className="md:w-1/2 p-8 flex flex-col justify-center">
            <h2 className="text-3xl font-serif text-brand-brown mb-3">{product.name}</h2>
            <div className="flex items-center mb-4">
                <StarRating rating={product.rating} />
                <span className="ml-2 text-sm text-gray-500">({product.reviews.length} отзывов)</span>
            </div>
            <p className="text-2xl font-serif text-brand-charcoal mb-5">{product.price.toLocaleString('ru-RU')} ₽</p>
            <p className="text-brand-charcoal leading-relaxed mb-6 line-clamp-4">{product.description}</p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                <Button size="lg" onClick={handleAddToCart} className="flex-1">
                    Добавить в корзину
                </Button>
                <Button size="lg" variant="outline" onClick={() => onViewDetails(product.id)} className="flex-1">
                    Подробнее
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
});