import React, { memo } from 'react';
import { StarIcon } from './Icons';
import { cn } from '../utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = memo(({ rating, maxRating = 5, size = 'md', showCount = true }) => {
  // Валидация: Убедимся, что рейтинг - это число в допустимом диапазоне [0, maxRating]
  const validRating = Math.max(0, Math.min(Number(rating) || 0, maxRating));

  const fullStars = Math.floor(validRating);
  const hasHalfStar = validRating % 1 >= 0.5;
  const emptyStars = Math.max(0, maxRating - fullStars - (hasHalfStar ? 1 : 0));

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const iconClass = cn(sizeClasses[size], "text-brand-terracotta");
  const emptyIconClass = cn(sizeClasses[size], "text-gray-200");

  return (
    <div className="flex items-center gap-0.5" aria-label={`Рейтинг ${validRating} из ${maxRating}`}>
      {[...Array(fullStars)].map((_, i) => (
        <StarIcon key={`full-${i}`} className={iconClass} />
      ))}
      {hasHalfStar && (
         <div className="relative">
            <StarIcon className={emptyIconClass} />
            <div className="absolute top-0 left-0 overflow-hidden w-1/2">
                <StarIcon className={iconClass} />
            </div>
         </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <StarIcon key={`empty-${i}`} className={emptyIconClass} />
      ))}
      
      {showCount && validRating > 0 && (
          <span className={cn("ml-1 font-medium text-gray-500", size === 'sm' ? 'text-[10px]' : 'text-xs')}>
              {validRating.toFixed(1)}
          </span>
      )}
    </div>
  );
});

StarRating.displayName = 'StarRating';
