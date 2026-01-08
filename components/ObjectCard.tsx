import React, { useState, memo, useCallback, useEffect } from 'react';
import type { ObjectPublic } from '../types';
import { useSaved } from '../contexts/SavedContext';
import { useHaptic } from '../hooks/useHaptic';
import Image from 'next/image';
import { cn } from '../utils';
import { CubeTransparentIcon, HeartIcon } from './icons/index';

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
    const imageUrl = object.imageUrls?.[0] || '';
    // Check if it's Unsplash or empty or placeholder
    const isUnsplash = imageUrl.includes('unsplash.com');
    const isValidImage = imageUrl && !isUnsplash && !imageUrl.includes('placeholder');

    // Viewed marker
    useEffect(() => {
      try {
        const viewed = JSON.parse(
          localStorage.getItem('label_viewed_objects') || '[]'
        );
        if (viewed.includes(object.id)) {
          setIsViewed(true);
        }
      } catch { }
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
      } catch { }

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
        className="group cursor-pointer flex flex-col gap-2 animate-fade-in"
        onClick={handleCardClick}
      >
        {/* Preview */}
        <div
          className={cn(
            'relative w-full aspect-[4/5] bg-stone-beige/10 rounded-2xl overflow-hidden shadow-soft',
            'dark:bg-aura-dark-surface dark:border dark:border-aura-dark-border dark:shadow-aura-glow',
            'transition-all duration-500 ease-out',
            'active:scale-[0.99]',
            isViewed ? 'ring-1 ring-soft-black/10 dark:ring-aura-dark-border' : 'ring-0',
          )}
        >
          {isValidImage ? (
            <Image
              src={imageUrl}
              alt={object.name || 'Object'}
              className={cn(
                'object-cover w-full h-full transition-all duration-700 ease-out group-hover:scale-105',
                isViewed ? 'opacity-90 saturate-90 dark:opacity-75' : 'opacity-95',
              )}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            // Aura Fallback: Soft gradient / Empty space
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <div className="w-2/3 h-2/3 rounded-full bg-stone-beige/20 blur-2xl dark:bg-stone-beige/5" />
            </div>
          )}

          {/* Saved */}
          <button
            onClick={handleSavedToggle}
            className={cn(
              'absolute top-3 right-3 p-2 rounded-full transition-all duration-300 z-10',
              'bg-white/70 backdrop-blur-md shadow-sm border border-stone-beige/20',
              'dark:bg-aura-dark-surface/80 dark:border-aura-dark-border',
              saved ? 'opacity-100' : 'opacity-60',
              isHeartAnimating ? 'scale-110' : 'scale-100'
            )}
          >
            <HeartIcon
              className={cn(
                'w-5 h-5 transition-colors duration-300',
                saved
                  ? 'fill-soft-black/80 text-soft-black/80 dark:fill-stone-beige dark:text-stone-beige'
                  : 'text-soft-black/55 dark:text-aura-dark-text-muted'
              )}
              strokeWidth={1.5}
            />
          </button>

          {/* AR indicator */}
          {(object.modelGlbUrl || object.modelUsdzUrl) && (
            <div className="absolute bottom-3 right-3 text-soft-black/45 bg-white/70 backdrop-blur-md rounded-full p-1.5 shadow-sm border border-stone-beige/20 pointer-events-none dark:bg-aura-dark-surface/80 dark:border-aura-dark-border dark:text-aura-dark-text-muted">
              <CubeTransparentIcon className="w-4 h-4 stroke-[1.5]" />
            </div>
          )}
        </div>

        <div className="px-1">
          <h3 className="text-[15px] font-medium text-soft-black/90 leading-tight truncate dark:text-aura-dark-text-main">
            {object.name}
          </h3>
        </div>
      </div>
    );
  }
);
