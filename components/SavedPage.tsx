
import React, { memo, useEffect, useState } from 'react';
import type { ObjectPublic, View } from '../types';
import type { SavedRedesign, SavedWizardConfig } from '../lib/saved/types';
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
  wizardConfigs: SavedWizardConfig[];
  redesigns: SavedRedesign[];
  isLoading: boolean;
  onNavigate: (view: View) => void;
  onOpenWizardConfig: (config: SavedWizardConfig) => void;
  onRemoveWizardConfig: (id: string) => void;
  onOpenRedesign: (redesign: SavedRedesign) => void;
  onRemoveRedesign: (id: string) => void;
  // Legacy props compatibility
  onQuickView?: (object: ObjectPublic) => void;
  onVirtualStage?: (object: ObjectPublic) => void;
}

const formatSavedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
};

const WIZARD_PRESENCE_LABELS: Record<string, string> = {
  compact: 'Компактный',
  balanced: 'Стандартный',
  dominant: 'Просторный',
};

const WIZARD_MOOD_LABELS: Record<string, string> = {
  calm: 'Спокойный',
  soft: 'Мягкий',
  expressive: 'Выразительный',
  strict: 'Строгий',
};

const REDESIGN_STYLE_LABELS: Record<string, string> = {
  minimal: 'Минимализм',
  cozy: 'Уютный',
  modern: 'Современный',
  classic: 'Классический',
};

const REDESIGN_MOOD_LABELS: Record<string, string> = {
  calm: 'Спокойный',
  warm: 'Тёплый',
  fresh: 'Свежий',
  dramatic: 'Выразительный',
};

const WizardConfigCard: React.FC<{
  config: SavedWizardConfig;
  onOpen: () => void;
  onRemove: () => void;
}> = ({ config, onOpen, onRemove }) => (
  <div className="rounded-[28px] border border-stone-beige/40 bg-white/90 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
    <div className="aspect-[4/3] bg-stone-beige/10 overflow-hidden">
      {config.objectImageUrl ? (
        <img src={config.objectImageUrl} alt={config.objectName} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-gray text-4xl">□</div>
      )}
    </div>
    <div className="p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-muted-gray">Конфигурация мебели</div>
          <div className="text-lg font-medium text-soft-black mt-1">{config.objectName}</div>
        </div>
        <div className="text-[11px] text-muted-gray whitespace-nowrap">{formatSavedAt(config.savedAt)}</div>
      </div>
      <p className="text-sm text-muted-gray">{config.summary}</p>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-muted-gray">
          {WIZARD_PRESENCE_LABELS[config.presence] || config.presence}
        </span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-muted-gray">
          {WIZARD_MOOD_LABELS[config.mood] || config.mood}
        </span>
      </div>
      <div className="flex gap-3">
        <Button onClick={onOpen} size="md" variant="primary" className="flex-1 rounded-xl text-sm">
          Посмотреть в интерьере
        </Button>
        <Button onClick={onRemove} size="md" variant="secondary" className="rounded-xl px-4 text-sm">
          Удалить
        </Button>
      </div>
    </div>
  </div>
);

const RedesignCard: React.FC<{
  redesign: SavedRedesign;
  onOpen: () => void;
  onRemove: () => void;
}> = ({ redesign, onOpen, onRemove }) => (
  <div className="rounded-[28px] border border-stone-beige/40 bg-white/90 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
    <div className="grid grid-cols-2 gap-px bg-stone-beige/20">
      <div className="aspect-[4/3] bg-stone-beige/10 overflow-hidden">
        {redesign.beforeImageUrl ? (
          <img src={redesign.beforeImageUrl} alt="До" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-gray text-xs">До</div>
        )}
      </div>
      <div className="aspect-[4/3] bg-stone-beige/10 overflow-hidden">
        {redesign.afterImageUrl ? (
          <img src={redesign.afterImageUrl} alt="После" className="w-full h-full object-cover" loading="lazy" />
        ) : redesign.objectImageUrl ? (
          <img src={redesign.objectImageUrl} alt={redesign.objectName} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-gray text-xs">После</div>
        )}
      </div>
    </div>
    <div className="p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-muted-gray">AI-редизайн</div>
          <div className="text-lg font-medium text-soft-black mt-1">{redesign.objectName}</div>
        </div>
        <div className="text-[11px] text-muted-gray whitespace-nowrap">{formatSavedAt(redesign.savedAt)}</div>
      </div>
      <p className="text-sm text-muted-gray">{redesign.summary}</p>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-muted-gray">
          {REDESIGN_STYLE_LABELS[redesign.style] || redesign.style}
        </span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-muted-gray">
          {REDESIGN_MOOD_LABELS[redesign.mood] || redesign.mood}
        </span>
      </div>
      <div className="flex gap-3">
        <Button onClick={onOpen} size="md" variant="primary" className="flex-1 rounded-xl text-sm">
          {redesign.objectId ? 'Посмотреть в интерьере' : 'Открыть коллекцию'}
        </Button>
        <Button onClick={onRemove} size="md" variant="secondary" className="rounded-xl px-4 text-sm">
          Удалить
        </Button>
      </div>
    </div>
  </div>
);

const SavedPageComponent: React.FC<SavedPageProps> = ({
  objects,
  wizardConfigs,
  redesigns,
  isLoading,
  onNavigate,
  onOpenWizardConfig,
  onRemoveWizardConfig,
  onOpenRedesign,
  onRemoveRedesign,
}) => {
  const hasItems = objects && objects.length > 0;
  const hasWizardConfigs = wizardConfigs.length > 0;
  const hasRedesigns = redesigns.length > 0;
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

        {hasWizardConfigs && (
          <div className="mb-12">
            <h2 className="text-lg font-medium text-soft-black mb-4">Конфигурации мебели</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {wizardConfigs.map((config) => (
                <WizardConfigCard
                  key={config.id}
                  config={config}
                  onOpen={() => onOpenWizardConfig(config)}
                  onRemove={() => onRemoveWizardConfig(config.id)}
                />
              ))}
            </div>
          </div>
        )}

        {hasRedesigns && (
          <div className="mb-12">
            <h2 className="text-lg font-medium text-soft-black mb-4">AI-редизайны</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {redesigns.map((redesign) => (
                <RedesignCard
                  key={redesign.id}
                  redesign={redesign}
                  onOpen={() => onOpenRedesign(redesign)}
                  onRemove={() => onRemoveRedesign(redesign.id)}
                />
              ))}
            </div>
          </div>
        )}

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
        ) : !handoffs.length && !loadingHandoffs && !hasWizardConfigs && !hasRedesigns ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-soft">
              <HeartIcon className="w-8 h-8 text-stone-beige stroke-1" />
            </div>
            <h2 className="text-xl font-medium text-soft-black mb-3">Здесь пока пусто</h2>
            <p className="text-muted-gray mb-8 max-w-sm font-light leading-relaxed">
              Сохраняйте понравившиеся объекты, конфигурации мебели и AI-редизайны.
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
