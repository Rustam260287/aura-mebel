import React, { useState, memo } from 'react';
import type { Review } from '../types';
import { StarRating } from './StarRating';
import { StarIcon } from './Icons';
import { Button } from './Button';

interface ReviewsProps {
  productId: string; // <-- ДОБАВЛЕНО
  reviews: Review[];
  onAddReview: (review: Omit<Review, 'date'>) => void;
}

const AddReviewForm: React.FC<{ onAddReview: (review: Omit<Review, 'date'>) => void; }> = ({ onAddReview }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [author, setAuthor] = useState('');
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!author.trim() || !comment.trim() || rating === 0) {
            setError('Пожалуйста, заполните все поля и поставьте оценку.');
            return;
        }
        onAddReview({ author, comment, rating });
        setAuthor('');
        setComment('');
        setRating(0);
        setError('');
    };

    return (
        <div className="mt-10 bg-white p-8 rounded-lg shadow-md">
            <h4 className="text-xl font-serif text-brand-brown mb-4">Оставить отзыв</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-2">
                    <span className="text-brand-charcoal font-medium">Ваша оценка:</span>
                    <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                            <StarIcon
                                key={star}
                                className={`w-6 h-6 cursor-pointer transition-colors ${
                                    (hoverRating || rating) >= star ? 'text-brand-gold' : 'text-gray-300'
                                }`}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                            />
                        ))}
                    </div>
                </div>
                <div>
                    <label htmlFor="author" className="block text-sm font-medium text-brand-charcoal mb-1">Ваше имя</label>
                    <input
                        type="text"
                        id="author"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-brown"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-brand-charcoal mb-1">Комментарий</label>
                    <textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-brown resize-none"
                        required
                    />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button type="submit">Отправить отзыв</Button>
            </form>
        </div>
    );
};


export const Reviews: React.FC<ReviewsProps> = memo(({ reviews, onAddReview }) => {
  return (
    <div className="mt-12">
      <h3 className="text-2xl font-serif text-brand-brown mb-6">Отзывы покупателей</h3>
      
      <AddReviewForm onAddReview={onAddReview} />

      {(!reviews || reviews.length === 0) ? (
        <div className="mt-8 text-center text-brand-charcoal bg-gray-50 p-6 rounded-md">
          <p>На этот товар еще нет отзывов. Будьте первым!</p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {reviews.map((review, index) => (
            <div key={index} className="border-b border-gray-200 pb-6">
              <div className="flex items-center mb-2">
                <StarRating rating={review.rating} />
                <span className="ml-4 font-bold text-brand-charcoal">{review.author}</span>
              </div>
              <p className="text-gray-500 text-sm mb-3">{new Date(review.date).toLocaleDateString('ru-RU')}</p>
              <p className="text-brand-charcoal leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

Reviews.displayName = 'Reviews';
