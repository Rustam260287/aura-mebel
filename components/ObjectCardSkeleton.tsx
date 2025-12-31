// components/ObjectCardSkeleton.tsx
import { Skeleton } from './Skeleton';

export const ObjectCardSkeleton = () => (
  <div className="w-full flex flex-col gap-2">
    <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-white shadow-soft">
      <Skeleton className="absolute inset-0" />
      <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/70 border border-stone-beige/20" />
      <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/60 border border-stone-beige/20" />
    </div>
    <div className="px-1">
      <Skeleton className="h-4 w-3/4 rounded" />
    </div>
  </div>
);
