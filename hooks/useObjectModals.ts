import { useState, useCallback } from 'react';
import type { ObjectPublic } from '../types';

interface ImageModalState {
  isOpen: boolean;
  images: string[];
  initialIndex: number;
  objectName: string;
}

export const useObjectModals = () => {
  const [quickViewObject, setQuickViewObject] = useState<ObjectPublic | null>(null);
  const [imageModalState, setImageModalState] = useState<ImageModalState>({
    isOpen: false,
    images: [],
    initialIndex: 0,
    objectName: '',
  });

  const openQuickView = useCallback((object: ObjectPublic) => {
    setQuickViewObject(object);
  }, []);

  const closeQuickView = useCallback(() => {
    setQuickViewObject(null);
  }, []);

  const handleImageClick = useCallback((object: ObjectPublic, index: number) => {
    setImageModalState({
      isOpen: true,
      images: object.imageUrls || [],
      initialIndex: index,
      objectName: object.name,
    });
  }, []);

  const closeImageModal = useCallback(() => {
    setImageModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    quickViewObject,
    openQuickView,
    closeQuickView,
    imageModalState,
    handleImageClick,
    closeImageModal,
  };
};
