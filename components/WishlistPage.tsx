import React, { memo } from 'react';
import { useWishlist } from '../contexts/WishlistContext';
import type { Product, View } from '../types';
import { ProductCard } from './ProductCard';
import { Button } from './Button';
import { useSwipe } from '../hooks/useSwipe';

interface WishlistPageProps {
  allProducts: Product[];
  onNavigate: (view: View) => void;
  onQuickView: (product: Product) => void;
  onVirtualStage: (product: Product) => void;
}

const WishlistPageComponent: React.FC<WishlistPageProps> = ({ allProducts, onNavigate, onQuickView, onVirtualStage }) => {
  const { wishlistItems } = useWishlist();
  const swipeHandlers = useSwipe({ onSwipeRight: () => onNavigate({ page: 'catalog' }) });


  const wishedProducts = allProducts.filter(p => wishlistItems.includes(p.id));
  const handleProductSelect = (productId: string) => {
    onNavigate({ page: 'product', productId });
  };

  return (
    <div className="container mx-auto px-6 py-12" {...swipeHandlers}>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif text-brand-brown mb-3">Избранное</h1>
      </div>
      {wishedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {wishedProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onProductSelect={handleProductSelect}
              onQuickView={onQuickView}
              onVirtualStage={onVirtualStage}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-lg text-brand-charcoal max-w-md mx-auto">
          <p>Ваш список избранного пуст.</p>
          <p className="text-base text-gray-500 mt-2">Нажмите на сердечко на карточке товара, чтобы добавить его сюда.</p>
          <Button className="mt-6" onClick={() => onNavigate({ page: 'catalog' })}>
            Перейти в каталог
          </Button>
        </div>
      )}
    </div>
  );
};

export const WishlistPage = memo(WishlistPageComponent);