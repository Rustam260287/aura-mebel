import React from 'react';

const GRID_PLACEHOLDERS = Array.from({ length: 6 });

export const JournalListSkeleton: React.FC = () => {
  return (
    <div className="bg-[#FBF9F4] min-h-screen">
      <div className="py-16 text-center border-b border-brand-brown/10">
        <div className="h-4 mx-auto mb-4 w-48 bg-gray-300/60 rounded-full animate-pulse"></div>
        <div className="h-14 mx-auto mb-4 w-60 bg-gray-300/70 rounded-xl animate-pulse"></div>
        <div className="h-4 mx-auto w-64 bg-gray-200/80 rounded-full animate-pulse"></div>
      </div>

      <div className="container mx-auto px-6 py-12 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="rounded-xl shadow-premium overflow-hidden bg-gray-200 animate-pulse aspect-[16/10]"></div>
          <div className="space-y-4">
            <div className="h-4 w-32 bg-gray-200/70 rounded-full animate-pulse"></div>
            <div className="h-12 w-full bg-gray-200/70 rounded-lg animate-pulse"></div>
            <div className="h-32 w-full bg-gray-200/70 rounded-lg animate-pulse"></div>
            <div className="h-4 w-40 bg-gray-200/70 rounded-full animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {GRID_PLACEHOLDERS.map((_, idx) => (
            <div key={idx} className="flex flex-col">
              <div className="rounded-lg h-[220px] bg-gray-200/80 animate-pulse"></div>
              <div className="mt-4 space-y-3">
                <div className="h-3 w-32 bg-gray-200/70 rounded-full animate-pulse"></div>
                <div className="h-8 w-full bg-gray-200/60 rounded-lg animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200/60 rounded-lg animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-200/60 rounded-full animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
