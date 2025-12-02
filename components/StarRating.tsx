import React, { memo } from 'react';
import { StarIcon } from './Icons';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = memo(({ rating, maxRating = 5, size = 'md' }) => {
  // Валидация: Убедимся, что рейтинг - это число в допустимом диапазоне [0, maxRating]
  const validRating = Math.max(0, Math.min(Number(rating) || 0, maxRating));

  const fullStars = Math.floor(validRating);
  const hasHalfStar = validRating % 1 >= 0.5;
  const emptyStars = Math.max(0, maxRating - fullStars - (hasHalfStar ? 1 : 0));

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconClass = `${sizeClasses[size]} text-brand-gold fill-current`;
  const emptyIconClass = `${sizeClasses[size]} text-gray-300`;

  return (
    <div className="flex items-center gap-0.5">
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
    </div>
  );
});

StarRating.displayName = 'StarRating';
