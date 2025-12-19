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
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100">
            <h4 className="text-lg font-bold text-brand-charcoal mb-4">Написать отзыв</h4>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">Ваша оценка</span>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                type="button"
                                key={star}
                                className="focus:outline-none"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                            >
                                <StarIcon
                                    className={`w-8 h-8 transition-colors ${
                                        (hoverRating || rating) >= star ? 'text-brand-terracotta' : 'text-gray-200'
                                    }`}
                                />
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                    <input
                        type="text"
                        id="author"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-brand-terracotta focus:outline-none focus:ring-1 focus:ring-brand-terracotta transition-colors text-sm"
                        placeholder="Как вас зовут?"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">Ваш отзыв</label>
                    <textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                         className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-brand-terracotta focus:outline-none focus:ring-1 focus:ring-brand-terracotta transition-colors text-sm resize-none"
                        placeholder="Расскажите о своих впечатлениях..."
                        required
                    />
                </div>
                {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
                <Button type="submit" className="w-full md:w-auto">Отправить отзыв</Button>
            </form>
        </div>
    );
};


export const Reviews: React.FC<ReviewsProps> = memo(({ reviews, onAddReview }) => {
  return (
    <div className="mt-16 md:mt-24 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
         <h3 className="text-2xl md:text-3xl font-serif text-brand-charcoal">Отзывы</h3>
         <span className="text-gray-400 font-serif text-xl md:text-2xl">({reviews?.length || 0})</span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
            {(!reviews || reviews.length === 0) ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-500">Пока нет отзывов. Станьте первым, кто оценит этот товар!</p>
                </div>
            ) : (
                <div className="space-y-6">
                {reviews.map((review, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-terracotta/10 text-brand-terracotta flex items-center justify-center font-bold text-lg">
                                {review.author.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-bold text-brand-charcoal text-sm">{review.author}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <StarRating rating={review.rating} size="sm" showCount={false} />
                                </div>
                            </div>
                        </div>
                        <span className="text-gray-400 text-xs">{new Date(review.date).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-sm pl-[52px]">{review.comment}</p>
                    </div>
                ))}
                </div>
            )}
        </div>

        <div className="lg:col-span-1">
             <div className="sticky top-24">
                 <AddReviewForm onAddReview={onAddReview} />
             </div>
        </div>
      </div>
    </div>
  );
});

Reviews.displayName = 'Reviews';
