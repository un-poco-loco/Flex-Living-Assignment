// app/dashboard/page-optimized.tsx
'use client';

import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { Review, PropertyStats } from '@/lib/types/review';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReviews } from '@/lib/hooks/useReviews';

// Lazy load heavy components for better initial load performance
const ReviewsTable = lazy(() => import('@/components/dashboard/ReviewsTable'));
const FilterPanel = lazy(() => import('@/components/dashboard/FilterPanel'));
const Analytics = lazy(() => import('@/components/dashboard/Analytics'));

interface ReviewFilters {
    listingId?: string;
    channel?: string;
    minRating?: string;
    sentiment?: string;
    dateRange?: string;
}

export default function DashboardPage() {
    const [filters, setFilters] = useState<ReviewFilters>({});
    const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState('overview');

    // Use SWR hook for data fetching with caching
    const { reviews, isLoading, error, refresh } = useReviews(
        {
            listingId: filters.listingId,
            channel: filters.channel,
            minRating: filters.minRating ? parseFloat(filters.minRating) : undefined,
            sentiment: filters.sentiment,
            dateRange: filters.dateRange ? parseInt(filters.dateRange) : undefined,
        },
        {
            // Additional SWR options for dashboard
            revalidateOnFocus: true,
            refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
        }
    );

    // Memoized handlers to prevent unnecessary re-renders
    const handleApproveForWebsite = useCallback(async (reviewIds: string[]) => {
        try {
            // Approve each review on the server
            await Promise.all(reviewIds.map(async (reviewId) => {
                const response = await fetch('/api/reviews/hostaway', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        reviewId,
                        updates: { isApprovedForWebsite: true }
                    })
                });
                
                if (!response.ok) {
                    console.error(`Failed to approve review ${reviewId}`);
                }
            }));

            // Refresh data and clear selection
            await refresh();
            setSelectedReviews(new Set());
            
            console.log(`Successfully approved ${reviewIds.length} reviews`);
        } catch (error) {
            console.error('Error approving reviews:', error);
        }
    }, [refresh]);

    const handleUnapproveForWebsite = useCallback(async (reviewIds: string[]) => {
        try {
            // Unapprove each review on the server
            await Promise.all(reviewIds.map(async (reviewId) => {
                const response = await fetch('/api/reviews/hostaway', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        reviewId,
                        updates: { isApprovedForWebsite: false }
                    })
                });
                
                if (!response.ok) {
                    console.error(`Failed to unapprove review ${reviewId}`);
                }
            }));

            // Refresh data and clear selection
            await refresh();
            setSelectedReviews(new Set());
            
            console.log(`Successfully unapproved ${reviewIds.length} reviews`);
        } catch (error) {
            console.error('Error unapproving reviews:', error);
        }
    }, [refresh]);

    // Memoized trend calculation - defined first to avoid hoisting issues
    const calculateTrendData = useCallback((reviews: Review[]) => {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const dailyData: Record<string, { sum: number; count: number }> = {};

        reviews
            .filter(r => new Date(r.submittedAt) >= last30Days)
            .forEach(review => {
                const date = new Date(review.submittedAt).toISOString().split('T')[0];
                if (!dailyData[date]) {
                    dailyData[date] = { sum: 0, count: 0 };
                }
                dailyData[date].sum += review.overallRating || 0;
                dailyData[date].count += 1;
            });

        return Object.entries(dailyData)
            .map(([date, data]) => ({
                date,
                rating: data.sum / data.count,
                count: data.count
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, []);

    // Memoized stats calculation to avoid recalculating on every render
    const stats = useMemo((): PropertyStats => {
        if (!reviews.length) {
            return {
                totalReviews: 0,
                averageRating: 0,
                categoryAverages: {},
                trendData: [],
                sentimentBreakdown: {}
            };
        }

        const totalReviews = reviews.length;
        const averageRating = reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / totalReviews;

        // Calculate category averages
        const categoryTotals: Record<string, { sum: number; count: number }> = {};
        reviews.forEach(review => {
            review.reviewCategory?.forEach(cat => {
                if (!categoryTotals[cat.category]) {
                    categoryTotals[cat.category] = { sum: 0, count: 0 };
                }
                categoryTotals[cat.category].sum += cat.rating / 2;
                categoryTotals[cat.category].count += 1;
            });
        });

        const categoryAverages = Object.entries(categoryTotals).reduce((acc, [cat, data]) => {
            acc[cat] = data.sum / data.count;
            return acc;
        }, {} as Record<string, number>);

        // Calculate sentiment breakdown
        const sentimentBreakdown = reviews.reduce((acc, review) => {
            const sentiment = review.sentiment || 'neutral';
            acc[sentiment] = (acc[sentiment] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Calculate trend data (last 30 days)
        const trendData = calculateTrendData(reviews);

        return {
            totalReviews,
            averageRating,
            categoryAverages,
            trendData,
            sentimentBreakdown
        };
    }, [reviews, calculateTrendData]);

    // Memoized button logic
    const bulkActionButtons = useMemo(() => {
        const selectedReviewObjects = reviews.filter(r => selectedReviews.has(r.id));
        const unapprovedSelected = selectedReviewObjects.filter(r => !r.isApprovedForWebsite);
        const approvedSelected = selectedReviewObjects.filter(r => r.isApprovedForWebsite);
        
        return {
            unapproved: unapprovedSelected,
            approved: approvedSelected
        };
    }, [reviews, selectedReviews]);

    // Handle filter changes
    const handleFiltersChange = useCallback((newFilters: ReviewFilters) => {
        setFilters(newFilters);
        setSelectedReviews(new Set()); // Clear selection when filters change
    }, []);

    // Handle selection changes  
    const handleSelectionChange = useCallback((newSelection: Set<string>) => {
        setSelectedReviews(newSelection);
    }, []);

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load reviews</h2>
                    <p className="text-gray-600 mb-4">{error.message}</p>
                    <button 
                        onClick={() => refresh()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-8">
                            <h1 className="text-2xl font-bold text-gray-900">Reviews Dashboard</h1>
                            <nav className="hidden md:flex gap-6">
                                <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
                                <a href="/properties" className="text-gray-600 hover:text-gray-900">Properties</a>
                                <button 
                                    onClick={() => {
                                        setActiveTab('overview');
                                        // Scroll to analytics section
                                        const analyticsSection = document.getElementById('analytics-section');
                                        if (analyticsSection) {
                                            analyticsSection.scrollIntoView({ behavior: 'smooth' });
                                        }
                                    }}
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    Analytics
                                </button>
                            </nav>
                        </div>
                        <div className="flex gap-4">
                            {bulkActionButtons.unapproved.length > 0 && (
                                <button
                                    onClick={() => handleApproveForWebsite(bulkActionButtons.unapproved.map(r => r.id))}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Approve for Website ({bulkActionButtons.unapproved.length})
                                </button>
                            )}
                            {bulkActionButtons.approved.length > 0 && (
                                <button
                                    onClick={() => handleUnapproveForWebsite(bulkActionButtons.approved.map(r => r.id))}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Unapprove from Website ({bulkActionButtons.approved.length})
                                </button>
                            )}
                            <button
                                onClick={refresh}
                                disabled={isLoading}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                            >
                                {isLoading ? 'Refreshing...' : 'Refresh'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 max-w-md">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="reviews">Reviews</TabsTrigger>
                        <TabsTrigger value="insights">Insights</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6" id="analytics-section">
                        <Suspense fallback={
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                ))}
                            </div>
                        }>
                            <Analytics stats={stats} />
                        </Suspense>
                    </TabsContent>

                    <TabsContent value="reviews" className="space-y-6">
                        <Suspense fallback={
                            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
                                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
                                    ))}
                                </div>
                            </div>
                        }>
                            <FilterPanel onFiltersChange={handleFiltersChange} />
                        </Suspense>
                        <Suspense fallback={
                            <div className="bg-white rounded-lg shadow animate-pulse">
                                <div className="p-6">
                                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                                    <div className="space-y-4">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        }>
                            <ReviewsTable
                                reviews={reviews}
                                loading={isLoading}
                                selectedReviews={selectedReviews}
                                onSelectionChange={handleSelectionChange}
                            />
                        </Suspense>
                    </TabsContent>

                    <TabsContent value="insights" className="space-y-6">
                        <Suspense fallback={
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                                        <div className="space-y-3">
                                            {[...Array(4)].map((_, j) => (
                                                <div key={j} className="h-4 bg-gray-200 rounded w-full"></div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        }>
                            <InsightsPanel reviews={reviews} />
                        </Suspense>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

// Memoized Insights Panel component to prevent unnecessary re-renders
const InsightsPanel = ({ reviews }: { reviews: Review[] }) => {
    const insights = useMemo(() => generateInsights(reviews), [reviews]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Recurring Issues</h3>
                <ul className="space-y-2">
                    {insights.issues.map((issue, idx) => (
                        <li key={idx} className="flex justify-between">
                            <span className="text-gray-700">{issue.keyword}</span>
                            <span className="text-gray-500">{issue.count} mentions</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Top Strengths</h3>
                <ul className="space-y-2">
                    {insights.strengths.map((strength, idx) => (
                        <li key={idx} className="flex justify-between">
                            <span className="text-gray-700">{strength.category}</span>
                            <span className="text-green-600">{strength.rating.toFixed(1)}/5</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

function generateInsights(reviews: Review[]) {
    // Generate issues from negative sentiment reviews
    const negativeReviews = reviews.filter(r => r.sentiment === 'negative');
    const issueKeywords = negativeReviews.flatMap(r => r.keywords || []);
    const issueFreq = issueKeywords.reduce((acc, keyword) => {
        acc[keyword] = (acc[keyword] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const issues = Object.entries(issueFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([keyword, count]) => ({ keyword, count }));

    // Generate strengths from category ratings
    const categoryTotals: Record<string, { sum: number; count: number }> = {};
    reviews.forEach(review => {
        review.reviewCategory?.forEach(cat => {
            if (!categoryTotals[cat.category]) {
                categoryTotals[cat.category] = { sum: 0, count: 0 };
            }
            categoryTotals[cat.category].sum += cat.rating / 2;
            categoryTotals[cat.category].count += 1;
        });
    });

    const strengths = Object.entries(categoryTotals)
        .map(([category, data]) => ({
            category: category.replace(/_/g, ' '),
            rating: data.sum / data.count
        }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);

    return { issues, strengths };
}