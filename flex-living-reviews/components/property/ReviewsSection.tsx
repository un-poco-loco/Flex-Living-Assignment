// components/property/ReviewsSection.tsx
import {Review} from '@/lib/types/review';
import {Star, ThumbsUp} from 'lucide-react';
import {format} from 'date-fns';

interface ReviewsSectionProps {
    reviews: Review[];
    loading: boolean;
}

export default function ReviewsSection({reviews, loading}: ReviewsSectionProps) {
    if (loading) {
        return (
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Guest Reviews</h2>
                <div className="animate-pulse space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-20 bg-gray-200 rounded"></div>
                            <div className="flex space-x-2">
                                {[1, 2, 3, 4].map(j => (
                                    <div key={j} className="h-3 bg-gray-200 rounded w-16"></div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (reviews.length === 0) {
        return (
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Guest Reviews</h2>
                <div className="text-center py-12">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No approved reviews yet</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        Reviews are carefully selected and approved by our team to ensure quality and authenticity.
                    </p>
                </div>
            </section>
        );
    }

    const averageRating = reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / reviews.length;

    return (
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Guest Reviews</h2>
                    <div className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
                        ✓ Verified Reviews
                    </div>
                </div>
                <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <Star className="w-6 h-6 text-yellow-400 fill-current"/>
                            <span className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                            <div>Excellent</div>
                            <div>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="text-sm text-gray-600 mb-2">Recent guest feedback</div>
                        <div className="flex gap-1">
                            {[5, 4, 3, 2, 1].map(rating => {
                                const count = reviews.filter(r => Math.floor(r.overallRating || 0) === rating).length;
                                const percentage = reviews.length ? (count / reviews.length) * 100 : 0;
                                return (
                                    <div key={rating} className="flex items-center gap-2 text-sm">
                                        <div className="w-16 bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-yellow-400 h-2 rounded-full" 
                                                style={{width: `${percentage}%`}}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {reviews.slice(0, 6).map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-8 last:border-0">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                    {review.guestName?.charAt(0) || 'G'}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{review.guestName}</h4>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span>{format(new Date(review.submittedAt), 'MMMM yyyy')}</span>
                                        <span>•</span>
                                        <span className="capitalize">{review.channel}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                                <Star className="w-4 h-4 text-yellow-500 fill-current"/>
                                <span className="font-semibold text-gray-900">{review.overallRating?.toFixed(1)}</span>
                            </div>
                        </div>

                        <p className="text-gray-700 leading-relaxed mb-4 text-lg">{review.publicReview}</p>

                        {review.reviewCategory && review.reviewCategory.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                {review.reviewCategory.slice(0, 6).map((cat) => (
                                    <div key={cat.category} className="bg-gray-50 rounded-lg p-3">
                                        <div className="text-sm font-medium text-gray-900 capitalize mb-1">
                                            {cat.category.replace(/_/g, ' ')}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-3 h-3 ${
                                                        i < Math.floor(cat.rating / 2)
                                                            ? 'text-yellow-400 fill-current'
                                                            : 'text-gray-300'
                                                    }`}
                                                />
                                            ))}
                                            <span className="text-sm font-medium text-gray-600 ml-1">
                                                {(cat.rating / 2).toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4"/>
                            Helpful review
                        </button>
                    </div>
                ))}

                {reviews.length > 6 && (
                    <div className="text-center pt-4">
                        <button className="px-6 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                            Show all {reviews.length} reviews
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}