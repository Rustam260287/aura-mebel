
import React, { memo } from 'react';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { Button } from './Button';

interface CatalogProps {
  allProducts: Product[];
  isLoading: boolean;
  onProductSelect: (productId: string) => void;
  onQuickView?: (product: Product) => void;
  onVirtualStage?: (product: Product) => void;
  onImageClick?: (product: Product, index: number) => void;
  isHomePage?: boolean;
}

const CatalogComponent: React.FC<CatalogProps> = ({
  allProducts,
  isLoading,
  onProductSelect,
  isHomePage = false,
}) => {
  const renderSkeletons = (count: number) =>
    Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ));

  return (
    <div className={isHomePage ? 'bg-warm-white pb-28' : ''}>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 md:gap-x-10 gap-y-14 md:gap-y-20">
          {renderSkeletons(isHomePage ? 6 : 8)}
        </div>
      ) : allProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 md:gap-x-10 gap-y-14 md:gap-y-20">
            {allProducts.map((product, index) => (
              <div
                key={product.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <ProductCard
                  product={product}
                  onProductSelect={onProductSelect}
                />
              </div>
            ))}
          </div>

          {isHomePage && (
            <div className="mt-28 text-center">
              <Button
                variant="secondary"
                onClick={() => {
                  /* Navigation handled by parent */
                }}
              >
                Смотреть всю коллекцию
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="py-32 text-center text-muted-gray">
          <p className="text-sm">Пока здесь пусто.</p>
        </div>
      )}
    </div>
  );
};

export const Catalog = memo(CatalogComponent);
