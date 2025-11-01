import { useState, TouchEvent } from 'react';

interface SwipeInput {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
}

interface SwipeOutput {
  onTouchStart: (e: TouchEvent<HTMLElement>) => void;
  onTouchMove: (e: TouchEvent<HTMLElement>) => void;
  onTouchEnd: () => void;
}

const MIN_SWIPE_DISTANCE = 75;

export const useSwipe = ({ onSwipeRight, onSwipeLeft }: SwipeInput): SwipeOutput => {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);

  const onTouchStart = (e: TouchEvent<HTMLElement>) => {
    setTouchEndX(null);
    setTouchEndY(null);
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: TouchEvent<HTMLElement>) => {
    setTouchEndX(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStartX || !touchEndX || !touchStartY || !touchEndY) return;

    const distanceX = touchEndX - touchStartX;
    const distanceY = touchEndY - touchStartY;
    const isRightSwipe = distanceX > MIN_SWIPE_DISTANCE;
    const isLeftSwipe = distanceX < -MIN_SWIPE_DISTANCE;

    // Убеждаемся, что это горизонтальный свайп, а не вертикальная прокрутка
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
        if (isRightSwipe && onSwipeRight) {
            onSwipeRight();
        }

        if (isLeftSwipe && onSwipeLeft) {
            onSwipeLeft();
        }
    }

    setTouchStartX(null);
    setTouchEndX(null);
    setTouchStartY(null);
    setTouchEndY(null);
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};
