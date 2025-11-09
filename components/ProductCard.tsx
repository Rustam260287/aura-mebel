import React, { useState, memo, useCallback } from 'react';
import type { Product } from '../types';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { HeartIcon, CubeTransparentIcon, ArrowUpTrayIcon } from './Icons';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';

interface ProductCardProps {
  product: Product;
  onProductSelect: (productId: string) => void;
  onQuickView?: (product: Product) => void;
  onVirtualStage?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = memo(({ product, onProductSelect, onQuickView, onVirtualStage }) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToast } = useToast();
  const [isAnimatingHeart, setIsAnimatingHeart] = useState(false);
  const isWished = isInWishlist(product.id);

  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  const handleWishlistToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isWished) {
      removeFromWishlist(product.id);
      addToast(`${product.name} удален из избранного`, 'info');
    } else {
      addToWishlist(product.id);
      addToast(`${product.name} добавлен в избранное`, 'success');
      setIsAnimatingHeart(true);
      setTimeout(() => setIsAnimatingHeart(false), 400);
    }
  }, [isWished, product.id, product.name, removeFromWishlist, addToWishlist, addToast]);

  const handleQuickViewClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickView?.(product);
  }, [onQuickView, product]);
  
  const handleVirtualStageClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onVirtualStage?.(product);
  }, [onVirtualStage, product]);

  const handleShareClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
        title: product.name,
        text: `Посмотрите этот товар в Aura Мебель: ${product.name}`,
        url: window.location.href,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.log('Share was cancelled or failed', err);
        }
    } else {
        try {
            await navigator.clipboard.writeText(shareData.url);
            addToast('Ссылка на товар скопирована!', 'info');
        } catch (err) {
            addToast('Не удалось скопировать ссылку.', 'error');
        }
    }
  }, [product.name, addToast]);


  return (
    <div 
      className="group relative bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      onClick={() => onProductSelect(product.id)}
    >
      {discount > 0 && (
        <div className="absolute top-3 left-3 z-10 bg-brand-terracotta text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            -{discount}%
        </div>
      )}
      <div className="absolute top-3 right-3 z-10 flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleShareClick}
          className="p-2 bg-white/70 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 transform sm:opacity-0 sm:group-hover:opacity-100 sm:-translate-x-2 sm:group-hover:translate-x-0"
          title="Поделиться"
          aria-label="Поделиться товаром"
        >
          <ArrowUpTrayIcon className="w-6 h-6 text-gray-600 hover:text-brand-brown transition-colors" />
        </button>
        {onVirtualStage && (
          <button
            onClick={handleVirtualStageClick}
            className="p-2 bg-white/70 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 transform sm:opacity-0 sm:group-hover:opacity-100 sm:-translate-x-2 sm:group-hover:translate-x-0"
            style={{ transitionDelay: '50ms' }}
            title="Примерить в интерьере"
            aria-label="Примерить в интерьере"
          >
            <CubeTransparentIcon className="w-6 h-6 text-gray-600 hover:text-brand-brown transition-colors" />
          </button>
        )}
        <button
          onClick={handleWishlistToggle}
          className={`p-2 bg-white/70 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 transform sm:opacity-0 sm:group-hover:opacity-100 sm:-translate-x-2 sm:group-hover:translate-x-0 ${isAnimatingHeart ? 'animate-heart-pop' : ''}`}
          style={{ transitionDelay: '100ms' }}
          aria-label={isWished ? 'Удалить из избранного' : 'Добавить в избранное'}
        >
          <HeartIcon className={`w-6 h-6 transition-colors ${isWished ? 'text-brand-terracotta fill-brand-terracotta' : 'text-gray-500 hover:text-brand-terracotta'}`} />
        </button>
      </div>
      <div className="relative overflow-hidden">
        <img 
          src={product.imageUrls[0]} 
          alt={product.name} 
          className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {onQuickView && (
           <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button 
              variant="primary" 
              className="bg-white/90 !text-brand-brown hover:bg-white backdrop-blur-sm shadow-lg" 
              onClick={handleQuickViewClick}
            >
              Быстрый просмотр
            </Button>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-brand-charcoal truncate" title={product.name}>{product.name}</h3>
        <p className="text-sm text-gray-500">{product.category}</p>
        <div className="flex justify-between items-center mt-3">
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-serif text-brand-brown">{product.price.toLocaleString('ru-RU')} ₽</p>
            {product.originalPrice && (
              <p className="text-base text-gray-400 line-through">{product.originalPrice.toLocaleString('ru-RU')} ₽</p>
            )}
          </div>
          <div className="flex items-center">
            <StarRating rating={product.rating} />
            <span className="text-xs text-gray-400 ml-1">({product.reviews.length})</span>
          </div>
        </div>
      </div>
    </div>
  );
});