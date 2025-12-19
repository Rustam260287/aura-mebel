
import React, { useState, memo, useMemo, Fragment, TouchEvent, useCallback } from 'react';
import type { Product, Review } from '../types';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { Reviews } from './Reviews';
import { ArrowLeftIcon, HeartIcon, ChevronLeftIcon, ChevronRightIcon, PhotoIcon, CubeIcon } from './Icons';
import { useCartDispatch } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';
import { useSwipe } from '../hooks/useSwipe';
import { ImageZoomModal } from './ImageZoomModal';
import { ARViewer } from './ARViewer'; 
import Image from 'next/image';
import { Tab } from '@headlessui/react';
import { cn } from '../utils';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

type GalleryItem = {
  type: 'image' | 'video' | '3d';
  url: string;
};

const ProductDetailComponent: React.FC<ProductDetailProps> = ({ product, onBack }) => {
  const safeProduct = useMemo(() => ({
    ...product,
    reviews: product.reviews ?? [],
    imageUrls: product.imageUrls ?? [],
    description: product.description ?? '',
  }), [product]);
  
  const { imageUrls, videoUrl, model3dUrl, model3dIosUrl, description, specs } = safeProduct;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  
  const { addToCart } = useCartDispatch();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToast } = useToast();
  
  const isWished = isInWishlist(safeProduct.id);

  const galleryItems = useMemo((): GalleryItem[] => {
      const items: GalleryItem[] = imageUrls.filter(url => url).map(url => ({ type: 'image', url }));
      if (videoUrl) items.push({ type: 'video', url: videoUrl });
      if (model3dUrl) items.push({ type: '3d', url: model3dUrl });
      return items;
  }, [imageUrls, videoUrl, model3dUrl]);

  const currentItem = galleryItems[currentIndex];

  const handleNext = useCallback(() => galleryItems.length > 0 && setCurrentIndex(prev => (prev + 1) % galleryItems.length), [galleryItems.length]);
  const handlePrev = useCallback(() => galleryItems.length > 0 && setCurrentIndex(prev => (prev - 1 + galleryItems.length) % galleryItems.length), [galleryItems.length]);
  
  const pageSwipe = useSwipe({ onSwipeRight: onBack });
  const pageSwipeHandlers = useMemo(
    () => ({
      onTouchStart: (e: TouchEvent<HTMLElement>) => {
        if (currentItem?.type !== '3d') pageSwipe.onTouchStart(e);
      },
      onTouchMove: (e: TouchEvent<HTMLElement>) => {
        if (currentItem?.type !== '3d') pageSwipe.onTouchMove(e);
      },
      onTouchEnd: () => {
        if (currentItem?.type !== '3d') pageSwipe.onTouchEnd();
      },
    }),
    [pageSwipe, currentItem],
  );
  const gallerySwipe = useSwipe({ onSwipeLeft: handleNext, onSwipeRight: handlePrev });
  
  const gallerySwipeHandlers = useMemo(() => ({
    onTouchStart: (e: TouchEvent<HTMLElement>) => { if (currentItem?.type !== '3d') gallerySwipe.onTouchStart(e); },
    onTouchMove: (e: TouchEvent<HTMLElement>) => { if (currentItem?.type !== '3d') gallerySwipe.onTouchMove(e); },
    onTouchEnd: () => { if (currentItem?.type !== '3d') gallerySwipe.onTouchEnd(); }
  }), [gallerySwipe, currentItem]);

  const handleWishlistClick = useCallback(() => { if (isWished) removeFromWishlist(safeProduct.id); else addToWishlist(safeProduct.id); }, [isWished, safeProduct.id, addToWishlist, removeFromWishlist]);
  const handleAddToCart = useCallback(() => { addToCart(safeProduct); addToast(`${safeProduct.name} добавлен в корзину`, 'success'); }, [addToCart, safeProduct, addToast]);
  const handleAddReview = useCallback((newReviewData: Omit<Review, 'date'>) => addToast('Спасибо за ваш отзыв!', 'success'), [addToast]);
  const imageItems = useMemo(() => galleryItems.filter(item => item.type === 'image').map(item => item.url), [galleryItems]);

  const translateSpecKey = (key: string) => {
    switch(key.toLowerCase()) {
        case 'width': return 'Ширина';
        case 'height': return 'Высота';
        case 'depth': return 'Глубина';
        case 'length': return 'Длина';
        default: return key;
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12" {...pageSwipeHandlers}>
        {/* Navigation */}
        <div className="mb-8">
            <button 
                onClick={onBack} 
                className="group inline-flex items-center text-[10px] font-bold text-gray-400 hover:text-brand-terracotta transition-colors uppercase tracking-widest"
            >
                <ArrowLeftIcon className="w-3 h-3 mr-2 transition-transform group-hover:-translate-x-1" />
                Назад
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          {/* Gallery Section */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="relative group bg-[#F9F9F9] rounded-sm overflow-hidden shadow-sm" {...gallerySwipeHandlers}>
              <div className="relative aspect-[4/3] md:aspect-square lg:aspect-[4/3] flex items-center justify-center">
                {currentItem ? (
                    <>
                        {currentItem.type === 'image' && (
                            <div className="w-full h-full relative cursor-zoom-in" onClick={() => setIsZoomModalOpen(true)}>
                                <Image 
                                    src={currentItem.url} 
                                    alt={safeProduct.name} 
                                    fill 
                                    sizes="(max-width: 768px) 100vw, 60vw" 
                                    priority 
                                    className="object-contain p-8 md:p-12 transition-transform duration-500 hover:scale-105" 
                                />
                            </div>
                        )}
                        {currentItem.type === 'video' && <video src={currentItem.url} controls className="w-full h-full object-contain" poster={imageUrls[0]}/>}
                        {currentItem.type === '3d' && (
                            <ARViewer 
                                src={currentItem.url} 
                                iosSrc={model3dIosUrl}
                                alt={safeProduct.name}
                                poster={imageUrls[0]}
                                product={safeProduct}
                                onAddToCart={handleAddToCart}
                            />
                        )}
                        {galleryItems.length > 1 && currentItem.type !== '3d' && (
                            <>
                                <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/80 hover:bg-white text-brand-charcoal/50 hover:text-brand-terracotta rounded-full transition-all z-10 hidden md:flex shadow-sm opacity-0 group-hover:opacity-100 items-center justify-center">
                                    <ChevronLeftIcon className="w-5 h-5" />
                                </button>
                                <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/80 hover:bg-white text-brand-charcoal/50 hover:text-brand-terracotta rounded-full transition-all z-10 hidden md:flex shadow-sm opacity-0 group-hover:opacity-100 items-center justify-center">
                                    <ChevronRightIcon className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </>
                ) : <div className="text-gray-300"><PhotoIcon className="w-24 h-24" /></div>}
              </div>
              
              <div className="absolute top-4 right-4 flex gap-2">
                 {model3dUrl && (
                     <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm" title="Доступен 3D просмотр">
                         <CubeIcon className="w-5 h-5 text-brand-terracotta" />
                     </div>
                 )}
              </div>
            </div>
            
            {/* Thumbnails */}
            {galleryItems.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
                    {galleryItems.map((item, index) => (
                        <button 
                            key={index} 
                            onClick={() => setCurrentIndex(index)} 
                            className={cn(
                                "relative w-20 h-20 flex-shrink-0 rounded-sm overflow-hidden transition-all duration-300 border",
                                currentIndex === index 
                                    ? 'border-brand-terracotta ring-1 ring-brand-terracotta opacity-100' 
                                    : 'border-transparent opacity-60 hover:opacity-100 grayscale hover:grayscale-0'
                            )}
                        >
                            {item.type === 'image' ? (
                                <Image src={item.url} alt={`View ${index + 1}`} fill sizes="80px" className="object-cover" />
                            ) : item.type === 'video' ? (
                                <div className="w-full h-full bg-black flex items-center justify-center text-white text-[10px] font-bold tracking-wider">VIDEO</div>
                            ) : (
                                <div className="w-full h-full bg-brand-cream-dark flex items-center justify-center"><CubeIcon className="w-6 h-6 text-brand-terracotta" /></div>
                            )}
                        </button>
                    ))}
                </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="lg:col-span-5 flex flex-col pt-2">
            <div className="mb-3">
                <span className="text-[10px] font-bold tracking-[0.2em] text-brand-terracotta uppercase bg-brand-terracotta/5 px-2 py-1 rounded inline-block">
                    {safeProduct.category}
                </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-serif text-brand-charcoal mb-4 leading-tight">
                {safeProduct.name}
            </h1>

            <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2">
                    <StarRating rating={safeProduct.rating ?? 0} />
                    <button className="text-xs text-gray-400 font-medium border-b border-gray-200 hover:text-brand-terracotta hover:border-brand-terracotta transition-colors">
                        {safeProduct.reviews?.length || 0} отзывов
                    </button>
                </div>
                {safeProduct.specs && (
                    <div className="text-xs text-gray-400 pl-4 border-l border-gray-200">
                        Артикул: {safeProduct.id.slice(0,8).toUpperCase()}
                    </div>
                )}
            </div>

            <div className="flex items-baseline gap-4 mb-8 pb-8 border-b border-gray-100">
                <span className="text-4xl font-light text-brand-charcoal tracking-tight">
                    {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(safeProduct.price)}
                </span>
                {safeProduct.originalPrice && (
                    <span className="text-lg text-gray-400 line-through decoration-1 decoration-gray-300">
                        {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(safeProduct.originalPrice)}
                    </span>
                )}
                {safeProduct.originalPrice && safeProduct.price && (
                     <span className="ml-auto text-xs font-bold text-white bg-brand-terracotta px-2 py-1 rounded">
                         - {Math.round((1 - safeProduct.price / safeProduct.originalPrice) * 100)}%
                     </span>
                )}
            </div>
            
            <div className="flex gap-4 mb-12">
              <Button 
                onClick={handleAddToCart} 
                className="flex-1 h-14 bg-brand-charcoal hover:bg-brand-brown text-white text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300 shadow-xl shadow-brand-charcoal/10"
              >
                В корзину
              </Button>
              <button 
                onClick={handleWishlistClick} 
                className={cn(
                    "w-14 h-14 flex items-center justify-center border transition-all duration-300 rounded-sm",
                    isWished 
                        ? 'border-brand-terracotta text-brand-terracotta bg-brand-terracotta/5' 
                        : 'border-gray-200 text-gray-400 hover:border-brand-brown hover:text-brand-brown'
                )}
                title={isWished ? "Удалить из избранного" : "Добавить в избранное"}
              >
                <HeartIcon className={cn("w-6 h-6", isWished && "fill-current")} />
              </button>
            </div>

            {/* Premium Tabs */}
            <Tab.Group>
                <Tab.List className="flex gap-8 border-b border-gray-100 mb-8">
                    {['Описание', 'Характеристики', 'Отзывы'].map((tab) => (
                        <Tab as={Fragment} key={tab}>
                            {({ selected }) => (
                                <button 
                                    className={cn(
                                        "pb-4 text-[10px] font-bold uppercase tracking-[0.2em] focus:outline-none transition-all duration-300 border-b-2",
                                        selected 
                                            ? 'border-brand-terracotta text-brand-terracotta' 
                                            : 'border-transparent text-gray-400 hover:text-brand-charcoal'
                                    )}
                                >
                                    {tab}
                                </button>
                            )}
                        </Tab>
                    ))}
                </Tab.List>

                <Tab.Panels className="min-h-[200px]">
                    {/* Description Panel */}
                    <Tab.Panel className="focus:outline-none animate-fadeIn">
                        <div className="prose prose-sm prose-brown max-w-none text-brand-charcoal/70 font-light leading-loose text-justify">
                            {description ? (
                                description.split('\n').map((paragraph, idx) => (
                                    paragraph.trim() && <p key={idx} className="mb-4">{paragraph.trim()}</p>
                                ))
                            ) : (
                                <p className="italic text-gray-400">Описание готовится к публикации...</p>
                            )}
                        </div>
                    </Tab.Panel>

                    {/* Specs Panel */}
                    <Tab.Panel className="focus:outline-none animate-fadeIn">
                        {specs && Object.keys(specs).length > 0 ? (
                            <dl className="grid grid-cols-1 gap-y-4">
                                {Object.entries(specs).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center pb-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors px-2 rounded">
                                        <dt className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                                            {translateSpecKey(key)}
                                        </dt>
                                        <dd className="text-sm font-medium text-brand-charcoal">
                                            {value} {Number(value) ? 'см' : ''}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        ) : (
                           <div className="text-gray-400 text-sm font-light italic">Характеристики не указаны.</div>
                        )}
                    </Tab.Panel>

                    {/* Reviews Panel */}
                    <Tab.Panel className="focus:outline-none animate-fadeIn">
                        <Reviews reviews={safeProduct.reviews} onAddReview={handleAddReview} productId={safeProduct.id} />
                    </Tab.Panel>
                </Tab.Panels>
            </Tab.Group>

          </div>
        </div>
      </div>
      <ImageZoomModal isOpen={isZoomModalOpen} onClose={() => setIsZoomModalOpen(false)} images={imageItems} initialIndex={imageItems.indexOf(currentItem?.url)} productName={safeProduct.name}/>
    </>
  );
};

export const ProductDetail = memo(ProductDetailComponent);
