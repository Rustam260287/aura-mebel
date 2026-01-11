import dynamic from 'next/dynamic';

// Lazy load heavy components
export const componentRegistry: Record<string, React.ComponentType<any>> = {
    ProductCarousel: dynamic(() => import('../../components/ProductCarousel').then(mod => mod.ProductCarousel)),
    AnalysisResult: dynamic(() => import('../../components/AnalysisResult').then(mod => mod.AnalysisResult)),
    // RoomZonesOverlay: dynamic(() => ...),
};

export type ComponentName = keyof typeof componentRegistry;
