import React, { useState, memo, useCallback, useEffect } from 'react';
import type { ObjectPublic } from '../types';
import { useSaved } from '../contexts/SavedContext';
import { useHaptic } from '../hooks/useHaptic';
import Image from 'next/image';
import { cn } from '../utils';
import { CubeTransparentIcon, HeartIcon } from './icons';

interface ObjectCardProps {
  object: ObjectPublic;
  onObjectSelect: (objectId: string) => void;
  onQuickView?: (object: ObjectPublic) => void;
  onVirtualStage?: (object: ObjectPublic) => void;
  onImageClick?: (object: ObjectPublic, index: number) => void;
}

// LABEL CANON:
// Card = object
// Action = AR
// Saved = quiet companion
export const ObjectCard: React.FC<ObjectCardProps> = memo(
  ({ object, onObjectSelect }) => {
    const [isHeartAnimating, setIsHeartAnimating] = useState(false);
    const [isViewed, setIsViewed] = useState(false);

    const { isSaved, addToSaved, removeFromSaved } = useSaved();
    const triggerHaptic = useHaptic();

    const saved = isSaved(object.id);
    const displayImage =
      // @ts-ignore
      (object as any).imageUrl || object.imageUrls?.[0] || '/placeholder.svg';

    // Viewed marker
    useEffect(() => {
      try {
        const viewed = JSON.parse(
          localStorage.getItem('label_viewed_objects') || '[]'
        );
        if (viewed.includes(object.id)) {
          setIsViewed(true);
        }
      } catch {}
    }, [object.id]);

    const handleCardClick = () => {
      try {
        const viewed = JSON.parse(
          localStorage.getItem('label_viewed_objects') || '[]'
        );
        if (!viewed.includes(object.id)) {
          localStorage.setItem(
            'label_viewed_objects',
            JSON.stringify([...viewed, object.id])
          );
        }
      } catch {}

      onObjectSelect(object.id);
    };

    const handleSavedToggle = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        triggerHaptic(10);
        setIsHeartAnimating(true);

        if (saved) {
          removeFromSaved(object.id);
        } else {
          addToSaved(object.id);
        }

        setTimeout(() => setIsHeartAnimating(false), 200);
      },
      [saved, object.id, removeFromSaved, addToSaved, triggerHaptic]
    );

    return (
      <div
        className="group cursor-pointer flex flex-col gap-3 animate-fade-in"
        onClick={handleCardClick}
      >
        {/* Preview */}
        <div className="relative w-full aspect-[4/5] bg-white rounded-xl overflow-hidden shadow-soft transition-transform duration-500 ease-out group-hover:scale-[1.015]">
          <Image
            src={displayImage}
            alt={object.name || 'Object'}
            className="object-cover w-full h-full opacity-95 group-hover:opacity-100 transition-opacity duration-500"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Saved */}
          <button
            onClick={handleSavedToggle}
            className={cn(
              'absolute top-3 right-3 p-2 rounded-full transition-all duration-300 z-10',
              'text-soft-black hover:text-brand-terracotta',
              saved
                ? 'opacity-100'
                : 'opacity-50 lg:opacity-0 lg:group-hover:opacity-100',
              isHeartAnimating ? 'scale-110' : 'scale-100'
            )}
          >
            <HeartIcon
              className={cn(
                'w-6 h-6 transition-colors duration-300',
                saved
                  ? 'fill-brand-terracotta text-brand-terracotta'
                  : 'text-white drop-shadow-sm'
              )}
              strokeWidth={1.5}
            />
          </button>

          {/* AR indicator */}
          {(object.modelGlbUrl || object.modelUsdzUrl) && (
            <div className="absolute bottom-3 right-3 text-soft-black/50 bg-white/80 backdrop-blur rounded-full p-1.5 shadow-sm pointer-events-none">
              <CubeTransparentIcon className="w-4 h-4" />
            </div>
          )}

          {isViewed && (
            <div className="absolute top-3 left-3 px-2 py-0.5 text-[11px] uppercase tracking-[0.3em] bg-white/70 rounded-full text-muted-gray">
              Уже смотрели
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-gray">
            <span>{object.objectType || 'Объект интерьера'}</span>
          </div>

          <h3 className="text-lg font-semibold text-soft-black leading-tight">
            {object.name}
          </h3>
        </div>
      </div>
    );
  }
);
