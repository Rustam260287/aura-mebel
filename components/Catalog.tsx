
import React, { memo } from 'react';
import type { ObjectPublic } from '../types';
import { ObjectCard } from './ObjectCard';
import { ObjectCardSkeleton } from './ObjectCardSkeleton';
import { Button } from './Button';

interface CatalogProps {
  allObjects: ObjectPublic[];
  isLoading: boolean;
  onObjectSelect: (objectId: string) => void;
  onQuickView?: (object: ObjectPublic) => void;
  onVirtualStage?: (object: ObjectPublic) => void;
  onImageClick?: (object: ObjectPublic, index: number) => void;
  isHomePage?: boolean;
}

const CatalogComponent: React.FC<CatalogProps> = ({
  allObjects,
  isLoading,
  onObjectSelect,
  isHomePage = false,
}) => {
  const renderSkeletons = (count: number) =>
    Array.from({ length: count }).map((_, i) => (
      <ObjectCardSkeleton key={i} />
    ));

  return (
    <div className={isHomePage ? 'bg-warm-white pb-28' : ''}>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 md:gap-x-10 gap-y-14 md:gap-y-20">
          {renderSkeletons(isHomePage ? 6 : 8)}
        </div>
      ) : allObjects.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 md:gap-x-10 gap-y-14 md:gap-y-20">
            {allObjects.map((object, index) => (
              <div
                key={object.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <ObjectCard
                  object={object}
                  onObjectSelect={onObjectSelect}
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
