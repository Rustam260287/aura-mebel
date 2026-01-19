
import React, { memo, useEffect, useState } from 'react';
import type { ObjectPublic, View } from '../types';
import { Button } from './Button';
import { HeartIcon } from './icons/index';
import { ObjectCard } from './ObjectCard';
import { ObjectCardSkeleton } from './ObjectCardSkeleton';
import { HandoffCard, HandoffStatus } from './HandoffCard';
import { getOrCreateVisitorId } from '../lib/analytics/visitorId';

interface HandoffItem {
  id: string;
  objectId: string;
  snapshotUrl?: string | null;
  status: HandoffStatus;
  createdAt?: string | null;
}

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
  const [handoffs, setHandoffs] = useState<HandoffItem[]>([]);
  const [loadingHandoffs, setLoadingHandoffs] = useState(true);

  // Fetch handoff history
  useEffect(() => {
    const fetchHandoffs = async () => {
      try {
        const visitorId = getOrCreateVisitorId();
        const res = await fetch(`/api/handoff/list?visitorId=${visitorId}`);
        if (res.ok) {
          const data = await res.json();
          setHandoffs(data.handoffs || []);
        }
      } catch (err) {
        console.error('[SavedPage] Failed to fetch handoffs:', err);
      } finally {
        setLoadingHandoffs(false);
      }
    };

    fetchHandoffs();
  }, []);

  const handleHandoffClick = (handoffId: string) => {
    // Navigate to handoff detail or open modal
    const handoff = handoffs.find((h) => h.id === handoffId);
    if (handoff?.objectId) {
      onNavigate({ page: 'object', objectId: handoff.objectId });
    }
  };

  return (
    <div className="bg-transparent min-h-[70vh] py-12 md:py-20">
      <div className="container mx-auto px-6">
        <h1 className="text-3xl md:text-4xl font-medium text-soft-black mb-12 tracking-tight">Сохранено</h1>

        {/* Handoff History Section */}
        {(handoffs.length > 0 || loadingHandoffs) && (
          <div className="mb-12">
            <h2 className="text-lg font-medium text-soft-black mb-4">Ваши AR-примерки</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {loadingHandoffs ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="aspect-[4/3] bg-stone-100 rounded-xl animate-pulse" />
                ))
              ) : (
                handoffs.map((h) => (
                  <HandoffCard
                    key={h.id}
                    id={h.id}
                    objectId={h.objectId}
                    snapshotUrl={h.snapshotUrl}
                    status={h.status}
                    createdAt={h.createdAt}
                    onClick={handleHandoffClick}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Favorites Section */}
        {hasItems && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-soft-black mb-4">Избранное</h2>
          </div>
        )}

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
        ) : !handoffs.length && !loadingHandoffs ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-soft">
              <HeartIcon className="w-8 h-8 text-stone-beige stroke-1" />
            </div>
            <h2 className="text-xl font-medium text-soft-black mb-3">Здесь пока пусто</h2>
            <p className="text-muted-gray mb-8 max-w-sm font-light leading-relaxed">
              Сохраняйте понравившиеся объекты и AR-примерки.
            </p>
            <Button
              onClick={() => onNavigate({ page: 'objects' })}
              className="bg-soft-black text-white px-8 rounded-xl h-12 text-sm font-medium hover:opacity-90 shadow-soft"
            >
              Перейти в галерею
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const SavedPage = memo(SavedPageComponent);
