import React, { useCallback } from 'react';
import { ObjectCard } from './ObjectCard';
import { useExperience } from '../contexts/ExperienceContext';
import type { ObjectPublic } from '../types';

interface ProductCarouselProps {
    products: (ObjectPublic & { aiReasoning?: string })[];
}

export const ProductCarousel: React.FC<ProductCarouselProps> = ({ products }) => {
    const { emitEvent } = useExperience();

    const handleSelect = useCallback((objectId: string) => {
        const product = products.find(p => p.id === objectId);
        // Switch context to the object (Closing chat effectively)
        emitEvent({
            type: 'VIEW_OBJECT',
            objectId,
            name: product?.name,
            objectType: product?.objectType
        });
    }, [emitEvent, products]);

    if (!products || products.length === 0) return null;

    return (
        <div className="flex gap-4 overflow-x-auto p-4 snap-x scrollbar-hide">
            {products.map((p) => (
                <div key={p.id} className="min-w-[240px] w-[240px] snap-center flex flex-col gap-2">
                    <ObjectCard
                        object={p}
                        onObjectSelect={handleSelect}
                    />
                    {p.aiReasoning && (
                        <div className="text-[10px] italic text-gray-500 px-1 leading-tight">
                            "{p.aiReasoning}"
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
