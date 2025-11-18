// components/ProductCardSkeleton.tsx
import { Skeleton } from './Skeleton';

export const ProductCardSkeleton = () => (
  <div className="group w-full">
    <Skeleton className="w-full aspect-square rounded-lg" />
    <Skeleton className="h-6 w-3/4 mt-4" />
    <Skeleton className="h-5 w-1/2 mt-2" />
    <Skeleton className="h-8 w-1/3 mt-2" />
  </div>
);
