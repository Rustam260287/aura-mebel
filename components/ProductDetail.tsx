
import React, { useState, TouchEvent, memo, useCallback, useMemo, Fragment } from 'react';
import type { Product, Review } from '../types';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { Reviews } from './Reviews';
import { ArrowLeftIcon, HeartIcon, ChevronLeftIcon, ChevronRightIcon, PhotoIcon, ArrowsRightLeftIcon, ArrowsUpDownIcon, CubeIcon } from './Icons';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';
import { useSwipe } from '../hooks/useSwipe';
import { ImageZoomModal } from './ImageZoomModal';
import Image from 'next/image';
import { Tab } from '@headlessui/react';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

// Умный парсер характеристик
const parseDescription = (description: string) => {
    const mainDescSeparator = 'Техническая информация:';
    let mainDescription = description.replace('Описание', '').trim();
    let techSpecs = [];

    const separatorIndex = description.indexOf(mainDescSeparator);
    if (separatorIndex !== -1) {
        mainDescription = description.substring(0, separatorIndex).replace('Описание', '').trim();
        const techPart = description.substring(separatorIndex + mainDescSeparator.length).trim();
        // Разделяем по названиям предметов, которые начинаются с заглавной буквы
        const regex = /(?=[А-Я][а-я]+(\s[А-Яа-я]+)*\s*Ш\.)/g;
        techSpecs = techPart.split(regex).filter(s => s.trim());
    }

    return { mainDescription, techSpecs };
};


const ProductDetailComponent: React.FC<ProductDetailProps> = ({ product, onBack }) => {
  const safeProduct = { reviews: [], imageUrls: [], details: { dimensions: '', material: '', care: '' }, description: '', ...product };

  const [currentReviews, setCurrentReviews] = useState<Review[]>(safeProduct.reviews);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToast } = useToast();
  
  const isWished = isInWishlist(safeProduct.id);

  const { mainDescription, techSpecs } = useMemo(() => parseDescription(safeProduct.description), [safeProduct.description]);

  // ... (остальные хуки без изменений)
  const handleNextImage = useCallback(() => { setCurrentImageIndex(prev => (prev + 1) % safeProduct.imageUrls.length); }, [safeProduct.imageUrls.length]);
  const handlePrevImage = useCallback(() => { setCurrentImageIndex(prev => (prev - 1 + safeProduct.imageUrls.length) % safeProduct.imageUrls.length); }, [safeProduct.imageUrls.length]);
  const handleWishlistClick = useCallback(() => { if (isWished) { removeFromWishlist(safeProduct.id); } else { addToWishlist(safeProduct.id); } }, [isWished, safeProduct.id, addToWishlist, removeFromWishlist]);
  const handleAddToCart = useCallback(() => { addToCart(safeProduct); addToast(`${safeProduct.name} добавлен в корзину`, 'success'); }, [addToCart, safeProduct, addToast]);

  return (
    <>
      <div className="container mx-auto px-6 py-12">
        <Button variant="ghost" onClick={onBack} className="mb-8 hidden md:inline-flex">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Назад в каталог
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          {/* ... (код галереи без изменений) ... */}

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-4xl lg:text-5xl font-serif text-brand-brown mb-4">{safeProduct.name}</h1>
            <div className="flex items-center mb-4">
              <StarRating rating={safeProduct.rating} />
              <span className="ml-2 text-sm text-gray-600">({currentReviews.length} отзывов)</span>
            </div>
            <p className="text-3xl lg:text-4xl font-serif text-brand-charcoal mb-8">{safeProduct.price.toLocaleString('ru-RU')} ₽</p>
            
            <div className="flex items-center gap-4 mb-8">
                <Button size="lg" onClick={handleAddToCart} className="flex-grow shadow-lg hover:shadow-xl transition-shadow">
                    Добавить в корзину
                </Button>
                <Button variant="outline" size="lg" onClick={handleWishlistClick} className="px-4 shadow-sm hover:shadow-md transition-shadow">
                    <HeartIcon className={`w-6 h-6 ${isWished ? 'text-red-500 fill-current' : ''}`} />
                </Button>
            </div>

            {/* --- НОВЫЙ БЛОК С ВКЛАДКАМИ --- */}
            <div className="w-full">
              <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-brand-cream-dark p-1">
                  <Tab as={Fragment}>
                    {({ selected }) => (
                      <button className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${ selected ? 'bg-white shadow text-brand-brown' : 'text-brand-charcoal hover:bg-white/[0.6]' }`}>
                        Описание
                      </button>
                    )}
                  </Tab>
                  <Tab as={Fragment}>
                    {({ selected }) => (
                      <button className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${ selected ? 'bg-white shadow text-brand-brown' : 'text-brand-charcoal hover:bg-white/[0.6]' }`}>
                        Характеристики
                      </button>
                    )}
                  </Tab>
                </Tab.List>
                <Tab.Panels className="mt-4">
                  <Tab.Panel className="rounded-xl bg-white p-6 shadow-inner border border-brand-cream-dark">
                    <div className="prose max-w-none text-brand-charcoal">
                      <p>{mainDescription}</p>
                    </div>
                  </Tab.Panel>
                  <Tab.Panel className="rounded-xl bg-white p-6 shadow-inner border border-brand-cream-dark">
                    <div className="space-y-4">
                      {techSpecs.map((spec, index) => (
                        <div key={index} className="p-4 rounded-md border bg-gray-50/50">
                          <h4 className="font-semibold text-brand-charcoal mb-2">{spec.split(' ')[0]}</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                            {spec.match(/Ш\.\s*[\d,]+|В\.\s*[\d,]+|[ДГ]\.\s*[\d,]+/g)?.map((dim, i) => (
                                <div key={i} className="flex items-center text-gray-600">
                                    {dim.startsWith('Ш') && <ArrowsRightLeftIcon className="w-4 h-4 mr-2 text-gray-400"/>}
                                    {dim.startsWith('В') && <ArrowsUpDownIcon className="w-4 h-4 mr-2 text-gray-400"/>}
                                    {(dim.startsWith('Д') || dim.startsWith('Г')) && <CubeIcon className="w-4 h-4 mr-2 text-gray-400"/>}
                                    <span>{dim}</span>
                                </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </div>
          </div>
        </div>
        <Reviews reviews={currentReviews} onAddReview={handleAddReview} />
      </div>
    </>
  );
};

export const ProductDetail = memo(ProductDetailComponent);
