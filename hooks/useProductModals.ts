import { useState, useCallback } from 'react';
import type { Product } from '../types';

interface ImageModalState {
  isOpen: boolean;
  images: string[];
  initialIndex: number;
  productName: string;
}

export const useProductModals = () => {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [imageModalState, setImageModalState] = useState<ImageModalState>({
    isOpen: false,
    images: [],
    initialIndex: 0,
    productName: '',
  });

  const openQuickView = useCallback((product: Product) => {
    setQuickViewProduct(product);
  }, []);

  const closeQuickView = useCallback(() => {
    setQuickViewProduct(null);
  }, []);

  const handleImageClick = useCallback((product: Product, index: number) => {
    setImageModalState({
      isOpen: true,
      images: product.imageUrls || [],
      initialIndex: index,
      productName: product.name,
    });
  }, []);

  const closeImageModal = useCallback(() => {
    setImageModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    quickViewProduct,
    openQuickView,
    closeQuickView,
    imageModalState,
    handleImageClick,
    closeImageModal,
  };
};
