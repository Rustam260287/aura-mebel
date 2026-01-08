
import React, { memo } from 'react';
import type { ObjectPublic, View } from '../types';
import { Button } from './Button';
import { HeartIcon } from './icons/index';
import { ObjectCard } from './ObjectCard';
import { ObjectCardSkeleton } from './ObjectCardSkeleton';

interface SavedPageProps {
  objects: ObjectPublic[];
  isLoading: boolean;
  onNavigate: (view: View) => void;
  // Legacy props compatibility
  onQuickView?: (object: ObjectPublic) => void;
  onVirtualStage?: (object: ObjectPublic) => void;
}

const SavedPageComponent: React.FC<SavedPageProps> = ({ objects, isLoading, onNavigate }) => {
  const hasItems = objects && objects.length > 0;

  return (
    <div className="bg-transparent min-h-[70vh] py-12 md:py-20">
      <div className="container mx-auto px-6">
        <h1 className="text-3xl md:text-4xl font-medium text-soft-black mb-12 tracking-tight">Сохранено</h1>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ObjectCardSkeleton key={i} />
            ))}
          </div>
        ) : hasItems ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
            {objects.map((object) => (
              <ObjectCard
                key={object.id}
                object={object}
                onObjectSelect={(id) => onNavigate({ page: 'object', objectId: id })}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-soft">
              <HeartIcon className="w-8 h-8 text-stone-beige stroke-1" />
            </div>
            <h2 className="text-xl font-medium text-soft-black mb-3">Здесь пока пусто</h2>
            <p className="text-muted-gray mb-8 max-w-sm font-light leading-relaxed">
              Сохраняйте понравившиеся объекты, чтобы вернуться к ним позже.
              Это ваше личное пространство для вдохновения.
            </p>
            <Button
              onClick={() => onNavigate({ page: 'objects' })}
              className="bg-soft-black text-white px-8 rounded-xl h-12 text-sm font-medium hover:opacity-90 shadow-soft"
            >
              Перейти в галерею
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export const SavedPage = memo(SavedPageComponent);
