import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useRedesign } from '../../contexts/RedesignContext';
import { Button } from '../Button';
import type { RedesignVariant } from '../../lib/redesign/types';


const HINT_KEY = 'aura_3d_hint_shown';

export const StepResultRedesign: React.FC = () => {
    const router = useRouter();
    const { result, resetRedesign } = useRedesign();
    const [showBefore, setShowBefore] = useState(false);
    const [show3DMode, setShow3DMode] = useState(false);

    // Variant selection
    const [selectedVariant, setSelectedVariant] = useState(0);

    // Transform state
    const [position, setPosition] = useState({ x: 50, y: 60 });
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);

    // Gesture state
    const [isInteracting, setIsInteracting] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);

    const containerRef = useRef<HTMLDivElement>(null);
    const lastTouchRef = useRef<{ x: number; y: number; dist: number }>({ x: 0, y: 0, dist: 0 });
    const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        import('@google/model-viewer');
    }, []);

    // Show hint on first 3D activation
    useEffect(() => {
        if (show3DMode && typeof window !== 'undefined') {
            const hintShown = localStorage.getItem(HINT_KEY);
            if (!hintShown) {
                setShowHint(true);
                localStorage.setItem(HINT_KEY, 'true');
                setTimeout(() => setShowHint(false), 3000);
            }
            startHideTimer();
        }
    }, [show3DMode]);

    const startHideTimer = () => {
        if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
        setControlsVisible(true);
        hideControlsTimer.current = setTimeout(() => setControlsVisible(false), 3000);
    };

    const showControls = () => {
        setControlsVisible(true);
        startHideTimer();
    };

    if (!result) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-muted-gray">Результат не получен</p>
            </div>
        );
    }

    const handleViewInAR = () => {
        if (result.selectedFurniture.id && result.selectedFurniture.id !== 'demo') {
            router.push(`/objects/${result.selectedFurniture.id}?auto_ar=true`);
        } else {
            router.push('/objects');
        }
    };

    const modelUrl = (result as any).selectedFurniture?.modelGlbUrl;

    // Calculate distance between two touch points
    const getTouchDistance = (t1: React.Touch, t2: React.Touch) => {
        return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    };

    // Touch start
    const handleTouchStart = (e: React.TouchEvent) => {
        if (!show3DMode) return;
        setIsInteracting(true);

        if (e.touches.length === 1) {
            lastTouchRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                dist: 0
            };
        } else if (e.touches.length === 2) {
            lastTouchRef.current = {
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
                dist: getTouchDistance(e.touches[0], e.touches[1]),
            };
        }
    };

    // Touch move
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!show3DMode || !containerRef.current) return;
        e.preventDefault();

        const rect = containerRef.current.getBoundingClientRect();

        if (e.touches.length === 1) {
            // Single touch: move position + rotate
            const deltaX = e.touches[0].clientX - lastTouchRef.current.x;
            const deltaY = e.touches[0].clientY - lastTouchRef.current.y;

            // Horizontal swipe = rotation
            if (Math.abs(deltaX) > Math.abs(deltaY) * 2) {
                setRotation(prev => (prev + deltaX * 0.5) % 360);
            } else {
                // Move position
                setPosition(prev => ({
                    x: Math.max(15, Math.min(85, prev.x + (deltaX / rect.width) * 100)),
                    y: Math.max(15, Math.min(85, prev.y + (deltaY / rect.height) * 100)),
                }));
            }

            lastTouchRef.current.x = e.touches[0].clientX;
            lastTouchRef.current.y = e.touches[0].clientY;

        } else if (e.touches.length === 2) {
            // Two fingers: pinch to scale
            const newDist = getTouchDistance(e.touches[0], e.touches[1]);
            const scaleDelta = (newDist - lastTouchRef.current.dist) * 0.005;

            setScale(prev => Math.max(0.3, Math.min(2, prev + scaleDelta)));
            lastTouchRef.current.dist = newDist;
        }
    };

    // Touch end
    const handleTouchEnd = () => {
        setIsInteracting(false);
        showControls();
    };

    // Mouse handlers for desktop
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!show3DMode) return;
        setIsInteracting(true);
        lastTouchRef.current = { x: e.clientX, y: e.clientY, dist: 0 };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!show3DMode || !isInteracting || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const deltaX = e.clientX - lastTouchRef.current.x;
        const deltaY = e.clientY - lastTouchRef.current.y;

        // Shift + drag = rotate
        if (e.shiftKey) {
            setRotation(prev => (prev + deltaX * 0.5) % 360);
        } else {
            setPosition(prev => ({
                x: Math.max(15, Math.min(85, prev.x + (deltaX / rect.width) * 100)),
                y: Math.max(15, Math.min(85, prev.y + (deltaY / rect.height) * 100)),
            }));
        }

        lastTouchRef.current.x = e.clientX;
        lastTouchRef.current.y = e.clientY;
    };

    const handleMouseUp = () => {
        setIsInteracting(false);
        showControls();
    };

    // Wheel for scale on desktop
    const handleWheel = (e: React.WheelEvent) => {
        if (!show3DMode) return;
        e.preventDefault();
        setScale(prev => Math.max(0.3, Math.min(2, prev - e.deltaY * 0.001)));
        showControls();
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-2xl w-full space-y-4">
                {/* Header */}
                <div className="text-center">
                    <h2 className="text-xl font-medium text-soft-black">Визуализация готова</h2>
                    <p className="text-sm text-muted-gray">{result.selectedFurniture.name}</p>
                </div>

                {/* Canvas */}
                <div
                    ref={containerRef}
                    className="relative aspect-video rounded-2xl overflow-hidden bg-stone-100 select-none touch-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    onClick={showControls}
                >
                    <img
                        src={showBefore ? result.before : result.after}
                        alt="Room"
                        className="w-full h-full object-cover pointer-events-none"
                    />

                    {/* Current preset indicator */}
                    {!show3DMode && !showBefore && result.currentPreset && (
                        <div className="absolute top-3 left-3 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-muted-gray">
                            {result.currentPreset === 'creative' ? 'Максимум' :
                                result.currentPreset === 'balanced' ? 'Баланс' : 'Минимум'}
                        </div>
                    )}

                    {/* 3D Model */}
                    {show3DMode && modelUrl && (
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                left: `${position.x}%`,
                                top: `${position.y}%`,
                                width: `${40 * scale}%`,
                                height: `${40 * scale}%`,
                                transform: 'translate(-50%, -50%)',
                                transition: isInteracting ? 'none' : 'all 0.15s ease-out',
                            }}
                        >
                            {/* @ts-ignore */}
                            <model-viewer
                                src={modelUrl}
                                auto-rotate={false}
                                shadow-intensity="1"
                                exposure="0.9"
                                camera-orbit={`${rotation}deg 75deg auto`}
                                disable-zoom
                                disable-pan
                                interaction-prompt="none"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: 'transparent',
                                    pointerEvents: 'none',
                                }}
                                environment-image="neutral"
                            />

                            {/* Interaction indicator */}
                            {isInteracting && (
                                <div className="absolute inset-0 border-2 border-white/40 rounded-xl" />
                            )}
                        </div>
                    )}

                    {/* Onboarding hint */}
                    {show3DMode && showHint && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                            <div className="bg-white/95 rounded-2xl px-6 py-4 text-center max-w-xs shadow-xl">
                                <p className="text-soft-black text-sm">
                                    Перетащите для перемещения
                                </p>
                                <p className="text-muted-gray text-xs mt-1">
                                    Сведите пальцы для масштаба
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Close button (auto-hide) */}
                    {show3DMode && (
                        <button
                            onClick={() => setShow3DMode(false)}
                            className={`absolute top-3 right-3 w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg transition-all duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0'
                                }`}
                        >
                            <span className="text-soft-black text-lg">✕</span>
                        </button>
                    )}

                    {/* Bottom toggle */}
                    {!show3DMode && (
                        <div className="absolute bottom-3 right-3 flex gap-2">
                            {modelUrl && (
                                <button
                                    onClick={() => setShow3DMode(true)}
                                    className="px-4 py-2.5 bg-white/95 backdrop-blur-sm rounded-full text-sm font-medium text-soft-black shadow-lg"
                                >
                                    Примерить мебель
                                </button>
                            )}
                            <button
                                onClick={() => setShowBefore(!showBefore)}
                                className="px-4 py-2.5 bg-white/95 backdrop-blur-sm rounded-full text-sm font-medium text-soft-black shadow-lg"
                            >
                                {showBefore ? 'После' : 'До'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Furniture preview */}
                {result.selectedFurniture.imageUrl && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-beige/30">
                        <img
                            src={result.selectedFurniture.imageUrl}
                            alt={result.selectedFurniture.name}
                            className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-soft-black text-sm truncate">
                                {result.selectedFurniture.name}
                            </p>
                        </div>
                        {modelUrl && (
                            <span className="px-2 py-1 bg-stone-100 text-muted-gray text-xs rounded-full">3D</span>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={resetRedesign}
                        className="flex-1 py-3 rounded-xl border border-stone-beige/50 text-soft-black hover:bg-stone-100 transition-colors text-sm"
                    >
                        Заново
                    </button>
                    <Button
                        onClick={handleViewInAR}
                        size="lg"
                        variant="primary"
                        className="flex-1 rounded-xl text-sm"
                    >
                        Смотреть в AR
                    </Button>
                </div>
            </div>
        </div>
    );
};
