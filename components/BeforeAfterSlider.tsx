import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import Image from 'next/image';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = memo(({ beforeImage, afterImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
  };

  const handleTouchStart = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };
  
  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging.current) {
      handleMove(e.clientX);
    }
  }, [handleMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging.current) {
      handleMove(e.touches[0].clientX);
    }
  }, [handleMove]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMoveTyped = (e: Event) => handleMouseMove(e as unknown as MouseEvent);
    const handleTouchMoveTyped = (e: Event) => handleTouchMove(e as unknown as TouchEvent);
    const handleMouseUpTyped = () => handleMouseUp();
    const handleTouchEndTyped = () => handleTouchEnd();

    window.addEventListener('mousemove', handleMouseMoveTyped);
    window.addEventListener('touchmove', handleTouchMoveTyped);
    window.addEventListener('mouseup', handleMouseUpTyped);
    window.addEventListener('touchend', handleTouchEndTyped);

    return () => {
      window.removeEventListener('mousemove', handleMouseMoveTyped);
      window.removeEventListener('touchmove', handleTouchMoveTyped);
      window.removeEventListener('mouseup', handleMouseUpTyped);
      window.removeEventListener('touchend', handleTouchEndTyped);
    };
  }, [handleMouseMove, handleTouchMove]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-lg overflow-hidden select-none cursor-ew-resize shadow-lg"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <Image
        src={afterImage}
        alt="After"
        className="object-cover"
        fill
        sizes="100vw"
      />
      <div
        className="absolute top-0 left-0 w-full h-full object-cover overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <Image
          src={beforeImage}
          alt="Before"
          className="object-cover"
          fill
          sizes="100vw"
        />
      </div>
       <div className="absolute top-0 left-0 bottom-0 flex items-center justify-center bg-brand-cream-dark/50 text-brand-charcoal text-sm font-semibold px-2 py-1 rounded-r-md">
        До
      </div>
      <div className="absolute top-0 right-0 bottom-0 flex items-center justify-center bg-brand-brown/50 text-white text-sm font-semibold px-2 py-1 rounded-l-md">
        После
      </div>
      <div
        className="absolute top-0 h-full w-1 bg-white cursor-ew-resize"
        style={{ left: `calc(${sliderPosition}% - 2px)` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center pointer-events-none">
          <svg className="w-5 h-5 text-brand-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </div>
      </div>
    </div>
  );
});

BeforeAfterSlider.displayName = 'BeforeAfterSlider';
