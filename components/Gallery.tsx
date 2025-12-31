
import React, { memo } from 'react';
import type { ObjectPublic } from '../types';
import { ObjectCardSkeleton } from './ObjectCardSkeleton';
import { ObjectCard } from './ObjectCard';
import { Button } from './Button';

interface GalleryProps {
  objects: ObjectPublic[];
  isLoading: boolean;
  onObjectSelect: (objectId: string) => void;
  onBrowseGallery?: () => void;
}

// LABEL GUIDE: Галерея избранных моделей.
// Карточка = объект. 
// Нет цен, скидок и торговых CTA. 
// Только фото, название, тип, иконки 3D/AR.

const GalleryComponent: React.FC<GalleryProps> = ({ objects, isLoading, onObjectSelect, onBrowseGallery }) => {
  
  if (isLoading) {
    return (
      <div className="-mx-6 px-6 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex gap-4 snap-x snap-mandatory scroll-smooth">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-none w-[78vw] max-w-[360px] snap-start">
              <ObjectCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!objects || objects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-gray leading-relaxed">
            Подборка обновляется. Можно начать с галереи.
          </p>
          {onBrowseGallery && (
            <Button
              variant="secondary"
              size="md"
              className="rounded-full px-5 h-11 shrink-0"
              onClick={onBrowseGallery}
            >
              Галерея
            </Button>
          )}
        </div>

        <div className="-mx-6 px-6 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-4 snap-x snap-mandatory scroll-smooth">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-none w-[78vw] max-w-[360px] snap-start">
                <ObjectCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-6 px-6 overflow-x-auto pb-2 scrollbar-hide">
      <div className="flex gap-4 snap-x snap-mandatory scroll-smooth">
        {objects.map((object) => (
          <div key={object.id} className="flex-none w-[78vw] max-w-[360px] snap-start">
            <ObjectCard object={object} onObjectSelect={onObjectSelect} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const Gallery = memo(GalleryComponent);
