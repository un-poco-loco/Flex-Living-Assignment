// components/dashboard/ReviewsTable.tsx
import {Review} from '@/lib/types/review';
import {useState, useMemo, memo, useCallback} from 'react';
import {Check, ChevronDown, ChevronUp, Star} from 'lucide-react';

interface ReviewsTableProps {
    reviews: Review[];
    loading: boolean;
    selectedReviews: Set<string>;
    onSelectionChange: (selected: Set<string>) => void;
}

const ReviewsTable = memo(function ReviewsTable({
                                         reviews,
                                         loading,
                                         selectedReviews,
                                         onSelectionChange
                                     }: ReviewsTableProps) {
    const [sortField, setSortField] = useState<keyof Review>('submittedAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const handleSort = useCallback((field: keyof Review) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    }, [sortField, sortDirection]);

    // Memoize sorted reviews to prevent unnecessary re-sorting
    const sortedReviews = useMemo(() => {
        return [...reviews].sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            const multiplier = sortDirection === 'asc' ? 1 : -1;

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return aVal.localeCompare(bVal) * multiplier;
            }
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return (aVal - bVal) * multiplier;
            }
            return 0;
        });
    }, [reviews, sortField, sortDirection]);

    const toggleRowExpansion = useCallback((reviewId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(reviewId)) {
            newExpanded.delete(reviewId);
        } else {
            newExpanded.add(reviewId);
        }
        setExpandedRows(newExpanded);
    }, [expandedRows]);

    const toggleSelection = useCallback((reviewId: string) => {
        const newSelection = new Set(selectedReviews);
        if (newSelection.has(reviewId)) {
            newSelection.delete(reviewId);
        } else {
            newSelection.add(reviewId);
        }
        onSelectionChange(newSelection);
    }, [selectedReviews, onSelectionChange]);

    const toggleSelectAll = useCallback(() => {
        if (selectedReviews.size === reviews.length) {
            onSelectionChange(new Set());
        } else {
            onSelectionChange(new Set(reviews.map(r => r.id)));
        }
    }, [selectedReviews.size, reviews, onSelectionChange]);

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-8">
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left">
                        <input
                            type="checkbox"
                            checked={selectedReviews.size === reviews.length && reviews.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded border-gray-300"
                        />
                    </th>
                    <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('listingName')}
                    >
                        Property
                        {sortField === 'listingName' && (
                            sortDirection === 'asc' ? <ChevronUp className="inline w-4 h-4 ml-1"/> :
                                <ChevronDown className="inline w-4 h-4 ml-1"/>
                        )}
                    </th>
                    <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('guestName')}
                    >
                        Guest
                    </th>
                    <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('overallRating')}
                    >
                        Rating
                        {sortField === 'overallRating' && (
                            sortDirection === 'asc' ? <ChevronUp className="inline w-4 h-4 ml-1"/> :
                                <ChevronDown className="inline w-4 h-4 ml-1"/>
                        )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Channel
                    </th>
                    <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('submittedAt')}
                    >
                        Date
                        {sortField === 'submittedAt' && (
                            sortDirection === 'asc' ? <ChevronUp className="inline w-4 h-4 ml-1"/> :
                                <ChevronDown className="inline w-4 h-4 ml-1"/>
                        )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                    </th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {sortedReviews.map((review) => (
                    <>
                        <tr key={review.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={selectedReviews.has(review.id)}
                                    onChange={() => toggleSelection(review.id)}
                                    className="rounded border-gray-300"
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                <a 
                                    href={`/property/${review.listingId}`}
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    {review.listingName}
                                </a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {review.guestName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current"/>
                                    <span className="ml-1 text-sm text-gray-900">
                      {review.overallRating?.toFixed(1) || 'N/A'}
                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                  <span
                      className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {review.channel}
                  </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(review.submittedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {review.isApprovedForWebsite ? (
                                    <span className="flex items-center text-green-600 text-sm">
                      <Check className="w-4 h-4 mr-1"/>
                      Published
                    </span>
                                ) : (
                                    <span className="text-gray-400 text-sm">Not published</span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                    onClick={() => toggleRowExpansion(review.id)}
                                    className="text-blue-600 hover:text-blue-900"
                                >
                                    {expandedRows.has(review.id) ? 'Hide' : 'View'} Details
                                </button>
                            </td>
                        </tr>
                        {expandedRows.has(review.id) && (
                            <tr>
                                <td colSpan={8} className="px-6 py-4 bg-gray-50">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold text-sm text-gray-900 mb-2">Review Content</h4>
                                            <p className="text-gray-700">{review.publicReview}</p>
                                        </div>
                                        {review.reviewCategory && review.reviewCategory.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-sm text-gray-900 mb-2">Category
                                                    Ratings</h4>
                                                <div className="grid grid-cols-3 gap-4">
                                                    {review.reviewCategory.map((cat) => (
                                                        <div key={cat.category} className="flex justify-between">
                                <span className="text-gray-600 capitalize">
                                  {cat.category.replace(/_/g, ' ')}:
                                </span>
                                                            <span
                                                                className="font-medium">{(cat.rating / 2).toFixed(1)}/5</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {review.keywords && review.keywords.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-sm text-gray-900 mb-2">Keywords</h4>
                                                <div className="flex gap-2">
                                                    {review.keywords.map((keyword) => (
                                                        <span
                                                            key={keyword}
                                                            className="px-2 py-1 text-xs bg-gray-200 rounded-full"
                                                        >
                                {keyword}
                              </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </>
                ))}
                </tbody>
            </table>
        </div>
    );
});

export default ReviewsTable;