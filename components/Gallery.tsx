
import React, { memo } from 'react';
import type { ObjectPublic } from '../types';
import { ObjectCardSkeleton } from './ObjectCardSkeleton';
import Image from 'next/image';
import { CubeTransparentIcon } from './icons';

interface GalleryProps {
  objects: ObjectPublic[];
  isLoading: boolean;
  onObjectSelect: (objectId: string) => void;
}

// LABEL GUIDE: Галерея избранных моделей.
// Карточка = объект. 
// Нет цен, скидок и торговых CTA. 
// Только фото, название, тип, иконки 3D/AR.

const GalleryComponent: React.FC<GalleryProps> = ({ objects, isLoading, onObjectSelect }) => {
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => <ObjectCardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
      {objects.map((object, index) => (
        <div 
            key={object.id} 
            className="group cursor-pointer flex flex-col gap-3 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => onObjectSelect(object.id)}
        >
            {/* Image Container */}
            <div className="relative w-full aspect-[3/4] bg-white rounded-xl overflow-hidden shadow-soft transition-transform duration-500 ease-out group-hover:scale-[1.02]">
                <Image 
                    src={object.imageUrls?.[0] || '/placeholder.svg'} 
                    alt={object.name}
                    className="object-cover w-full h-full opacity-95 group-hover:opacity-100 transition-opacity duration-500"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                />
                
                {/* 3D/AR Indicator - Quiet hint */}
                {(object.modelGlbUrl || object.modelUsdzUrl) && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full p-2 text-soft-black/60 shadow-sm">
                        <CubeTransparentIcon className="w-4 h-4" />
                    </div>
                )}
            </div>

            {/* Info - Minimal */}
            <div className="px-1">
                <h3 className="text-[15px] font-medium text-soft-black leading-tight mb-1 group-hover:opacity-70 transition-opacity">
                    {object.name}
                </h3>
                <p className="text-[13px] text-muted-gray leading-tight">
                    {object.objectType || 'Объект интерьера'}
                </p>
            </div>
        </div>
      ))}
    </div>
  );
};

export const Gallery = memo(GalleryComponent);
