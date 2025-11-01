
import React, { useState } from 'react';
import type { Product, Review } from '../types';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { Reviews } from './Reviews';
import { ArrowLeftIcon, CubeTransparentIcon, PaintBrushIcon } from './Icons';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';
import { HeartIcon } from './Icons';
import { useSwipe } from '../hooks/useSwipe';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onConfigure?: (product: Product) => void;
  onVirtualStage?: (product: Product) => void;
  onUpholsteryChange?: (product: Product) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack, onConfigure, onVirtualStage, onUpholsteryChange }) => {
  const [activeImage, setActiveImage] = useState(product.imageUrls[0]);
  const [currentReviews, setCurrentReviews] = useState<Review[]>(product.reviews);
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToast } = useToast();
  const swipeHandlers = useSwipe({ onSwipeRight: onBack });

  const isWished = isInWishlist(product.id);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  const handleWishlistClick = () => {
    if (isWished) {
      removeFromWishlist(product.id);
      addToast(`${product.name} удален из избранного`, 'info');
    } else {
      addToWishlist(product.id);
      addToast(`${product.name} добавлен в избранное`, 'success');
    }
  };
  
  const handleAddToCart = () => {
      addToCart(product);
      addToast(`${product.name} добавлен в корзину`, 'success');
  };

  const handleAddReview = (newReviewData: Omit<Review, 'date'>) => {
    const newReview: Review = {
      ...newReviewData,
      date: new Date().toISOString(),
    };
    setCurrentReviews(prev => [newReview, ...prev]);
    addToast('Спасибо за ваш отзыв!', 'success');
  };

  return (
    <div className="container mx-auto px-6 py-12" {...swipeHandlers}>
      <Button variant="ghost" onClick={onBack} className="mb-8">
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Назад в каталог
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div>
          <div 
            className="relative mb-4 rounded-lg overflow-hidden shadow-md cursor-zoom-in"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZoomActive(true)}
            onMouseLeave={() => setIsZoomActive(false)}
          >
            <img 
              src={activeImage} 
              alt={product.name} 
              className="w-full h-auto object-cover aspect-square transition-transform duration-200 ease-out"
              style={{
                transform: isZoomActive ? 'scale(2)' : 'scale(1)',
                transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
              }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {product.imageUrls.map(url => (
              <div
                key={url}
                className={`cursor-pointer rounded-md overflow-hidden border-2 ${activeImage === url ? 'border-brand-brown' : 'border-transparent'}`}
                onClick={() => setActiveImage(url)}
              >
                <img src={url} alt="" className="w-full h-full object-cover aspect-square" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Product Info */}
        <div>
          <h1 className="text-4xl font-serif text-brand-brown mb-4">{product.name}</h1>
          <div className="flex items-center mb-4">
            <StarRating rating={product.rating} />
            <span className="ml-2 text-sm text-gray-600">({currentReviews.length} отзывов)</span>
          </div>
          <p className="text-3xl font-serif text-brand-charcoal mb-6">{product.price.toLocaleString('ru-RU')} ₽</p>
          <p className="text-brand-charcoal leading-relaxed mb-8">{product.seoDescription || product.description}</p>
          
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center gap-4">
                {product.isConfigurable ? (
                  <Button size="lg" onClick={() => onConfigure?.(product)} className="flex-grow">
                    Конфигурировать
                  </Button>
                ) : (
                  <Button size="lg" onClick={handleAddToCart} className="flex-grow">
                    Добавить в корзину
                  </Button>
                )}
                <Button variant="outline" size="lg" onClick={handleWishlistClick} className="px-4">
                  <HeartIcon className={`w-6 h-6 ${isWished ? 'text-red-500 fill-current' : ''}`} />
                </Button>
            </div>
            <div className="flex items-center gap-4">
              {onVirtualStage && (
                <Button size="lg" variant="outline" onClick={() => onVirtualStage(product)} className="flex-grow">
                  <CubeTransparentIcon className="w-6 h-6 mr-3" />
                  Примерить в интерьере
                </Button>
              )}
              {product.isConfigurable && onUpholsteryChange && (
                 <Button size="lg" variant="outline" onClick={() => onUpholsteryChange(product)} className="flex-grow">
                  <PaintBrushIcon className="w-6 h-6 mr-3" />
                  ИИ-стилист обивки
                </Button>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-brand-charcoal mb-3">Характеристики</h3>
            <ul className="list-disc list-inside text-brand-charcoal space-y-2 leading-relaxed">
              <li><strong>Размеры:</strong> {product.details.dimensions}</li>
              <li><strong>Материал:</strong> {product.details.material}</li>
              <li><strong>Уход:</strong> {product.details.care}</li>
            </ul>
          </div>
        </div>
      </div>
      <Reviews reviews={currentReviews} onAddReview={handleAddReview} />
    </div>
  );
};