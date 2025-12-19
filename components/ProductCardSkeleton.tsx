// components/ProductCardSkeleton.tsx
import { Skeleton } from './Skeleton';

export const ProductCardSkeleton = () => (
  <div className="group w-full flex flex-col h-full border border-gray-100 rounded-sm p-4 bg-white shadow-sm">
    <Skeleton className="w-full aspect-[4/5] rounded-sm mb-4" />
    <div className="space-y-3 flex-grow">
         <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
         </div>
         <Skeleton className="h-5 w-full" />
         <Skeleton className="h-4 w-2/3" />
    </div>
    <div className="pt-4 mt-auto border-t border-gray-50 flex justify-between items-end">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-16" />
    </div>
  </div>
);
