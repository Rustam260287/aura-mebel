import React, { memo } from 'react';
import Image from 'next/image';
import type { ScenePresetPublic } from '../types';
import { CubeTransparentIcon } from './icons/index';

interface SceneCardProps {
  scene: ScenePresetPublic;
  onSelect: (sceneId: string) => void;
}

export const SceneCard: React.FC<SceneCardProps> = memo(({ scene, onSelect }) => {
  const cover = scene.coverImageUrl || '';
  const isUnsplash = cover.includes('unsplash.com');
  const isValidImage = cover && !isUnsplash && !cover.includes('placeholder');

  const count = Array.isArray(scene.objects) ? scene.objects.length : 0;
  const countLabel =
    count === 1 ? '1 предмет' :
    count >= 2 && count <= 4 ? `${count} предмета` :
    count > 4 ? `${count} предметов` :
    'Сцена';

  return (
    <div
      className="group cursor-pointer flex flex-col gap-3 animate-fade-in"
      onClick={() => onSelect(scene.id)}
    >
      <div className="relative w-full aspect-[4/5] bg-stone-beige/10 rounded-xl overflow-hidden shadow-soft transition-transform duration-500 ease-out group-hover:scale-[1.015]">
        {isValidImage ? (
          <Image
            src={cover}
            alt={scene.title}
            className="object-cover w-full h-full opacity-95 group-hover:opacity-100 transition-opacity duration-500"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="w-2/3 h-2/3 rounded-full bg-stone-beige/20 blur-2xl" />
          </div>
        )}

        <div className="absolute top-3 left-3 px-2 py-0.5 text-[11px] uppercase tracking-[0.3em] bg-white/70 rounded-full text-muted-gray">
          Сцена
        </div>

        <div className="absolute bottom-3 right-3 text-soft-black/50 bg-white/80 backdrop-blur rounded-full p-1.5 shadow-sm pointer-events-none">
          <CubeTransparentIcon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex flex-col gap-1 px-1">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-gray">
          <span>{countLabel}</span>
        </div>

        <h3 className="text-lg font-semibold text-soft-black leading-tight">{scene.title}</h3>
      </div>
    </div>
  );
});

