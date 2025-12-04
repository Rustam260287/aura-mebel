
import React, { useState, useRef, useCallback, MouseEvent, TouchEvent } from 'react';
import Image from 'next/image';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

interface BeforeAfterSliderProps {
  before: string;
  after: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ before, after }) => {
  // --- ЗАЩИТА: Не рендерим компонент, если нет изображений ---
  if (!before || !after) {
    return null;
  }

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

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
  };

  const handleMouseUp = (e: MouseEvent) => {
    e.preventDefault();
    isDragging.current = false;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    handleMove(e.clientX);
  };
  
  const handleTouchStart = (e: TouchEvent) => {
      isDragging.current = true;
  };
  
  const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      handleMove(e.touches[0].clientX);
  };
  
  const handleTouchEnd = () => {
      isDragging.current = false;
  };

  return (
    <div 
      className="relative w-full aspect-square max-w-full mx-auto select-none overflow-hidden rounded-xl shadow-lg"
      ref={containerRef}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <div className="relative w-full h-full">
        <Image src={before} alt="Интерьер до редизайна" className="object-cover" fill priority />
        
        <div 
          className="absolute top-0 left-0 h-full w-full overflow-hidden" 
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <Image src={after} alt="Интерьер после редизайна" className="object-cover" fill priority />
        </div>
      </div>
      
      <div 
        className="absolute top-0 h-full cursor-ew-resize"
        style={{ left: `calc(${sliderPosition}% - 2px)` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="w-1 h-full bg-white opacity-75" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing">
            <ArrowsRightLeftIcon className="w-6 h-6 text-brand-brown" />
        </div>
      </div>
    </div>
  );
};
