// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Review, PropertyStats } from '@/lib/types/review';
import ReviewsTable from '@/components/dashboard/ReviewsTable';
import FilterPanel from '@/components/dashboard/FilterPanel';
import Analytics from '@/components/dashboard/Analytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DashboardPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState('overview');
    const [lastFetch, setLastFetch] = useState<number>(0);
    const CACHE_DURATION = 30 * 1000; // 30 seconds

    useEffect(() => {
        // Check for property parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const propertyParam = urlParams.get('property');
        if (propertyParam) {
            setFilters(prev => ({ ...prev, listingId: propertyParam }));
            setActiveTab('reviews'); // Switch to reviews tab when filtering by property
        }
        fetchReviews();
    }, []);

    useEffect(() => {
        fetchReviews();
    }, [filters]);

    const fetchReviews = async () => {
        const now = Date.now();
        if (reviews.length > 0 && now - lastFetch < CACHE_DURATION) return; // Use cached data

        setLoading(true);
        try {
            const params = new URLSearchParams(filters);
            const response = await fetch(`/api/reviews/hostaway?${params}`);
            const data = await response.json();
            if (data.status === 'success') {
                setReviews(data.result);
                setLastFetch(now);
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveForWebsite = async (reviewIds: string[]) => {
        try {
            // Approve each review on the server
            for (const reviewId of reviewIds) {
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
            }

            // Refresh the data from the server to get the latest state
            await fetchReviews();
            
            // Clear selection
            setSelectedReviews(new Set());
            
            console.log(`Successfully approved ${reviewIds.length} reviews`);
        } catch (error) {
            console.error('Error approving reviews:', error);
        }
    };

    const handleUnapproveForWebsite = async (reviewIds: string[]) => {
        try {
            // Unapprove each review on the server
            for (const reviewId of reviewIds) {
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
            }

            // Refresh the data from the server to get the latest state
            await fetchReviews();
            
            // Clear selection
            setSelectedReviews(new Set());
            
            console.log(`Successfully unapproved ${reviewIds.length} reviews`);
        } catch (error) {
            console.error('Error unapproving reviews:', error);
        }
    };

    const calculateStats = (): PropertyStats => {
        const totalReviews = reviews.length;
        const averageRating = reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / totalReviews || 0;

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
    };

    const calculateTrendData = (reviews: Review[]) => {
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
    };

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
                                        // Scroll to top of analytics section
                                        document.getElementById('analytics-section')?.scrollIntoView({ 
                                            behavior: 'smooth', 
                                            block: 'start' 
                                        });
                                    }}
                                    className={`hover:text-gray-900 transition-colors duration-200 ${
                                        activeTab === 'overview' 
                                            ? 'text-blue-600 font-medium border-b-2 border-blue-600' 
                                            : 'text-gray-600'
                                    }`}
                                >
                                    Analytics
                                </button>
                            </nav>
                        </div>
                        <div className="flex gap-4">
                            {(() => {
                                const selectedReviewsArray = Array.from(selectedReviews);
                                const selectedReviewObjects = reviews.filter(r => selectedReviews.has(r.id));
                                const unapprovedSelected = selectedReviewObjects.filter(r => !r.isApprovedForWebsite);
                                const approvedSelected = selectedReviewObjects.filter(r => r.isApprovedForWebsite);
                                
                                return (
                                    <>
                                        {unapprovedSelected.length > 0 && (
                                            <button
                                                onClick={() => handleApproveForWebsite(unapprovedSelected.map(r => r.id))}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                            >
                                                Approve for Website ({unapprovedSelected.length})
                                            </button>
                                        )}
                                        {approvedSelected.length > 0 && (
                                            <button
                                                onClick={() => handleUnapproveForWebsite(approvedSelected.map(r => r.id))}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                            >
                                                Unapprove from Website ({approvedSelected.length})
                                            </button>
                                        )}
                                    </>
                                );
                            })()}
                            <button
                                onClick={fetchReviews}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Refresh
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
                        <Analytics stats={calculateStats()} />
                    </TabsContent>

                    <TabsContent value="reviews" className="space-y-6">
                        <FilterPanel onFiltersChange={setFilters} />
                        <ReviewsTable
                            reviews={reviews}
                            loading={loading}
                            selectedReviews={selectedReviews}
                            onSelectionChange={setSelectedReviews}
                        />
                    </TabsContent>

                    <TabsContent value="insights" className="space-y-6">
                        <InsightsPanel reviews={reviews} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

function InsightsPanel({ reviews }: { reviews: Review[] }) {
    const insights = generateInsights(reviews);

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
}

function generateInsights(reviews: Review[]) {
    // Analyze keywords for recurring issues
    const keywordFreq: Record<string, number> = {};
    reviews.forEach(review => {
        review.keywords?.forEach(keyword => {
            keywordFreq[keyword] = (keywordFreq[keyword] || 0) + 1;
        });
    });

    const issues = Object.entries(keywordFreq)
        .filter(([keyword]) => isNegativeKeyword(keyword))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([keyword, count]) => ({ keyword, count }));

    // Identify top performing categories
    const categoryScores: Record<string, number[]> = {};
    reviews.forEach(review => {
        review.reviewCategory?.forEach(cat => {
            if (!categoryScores[cat.category]) {
                categoryScores[cat.category] = [];
            }
            categoryScores[cat.category].push(cat.rating / 2);
        });
    });

    const strengths = Object.entries(categoryScores)
        .map(([category, scores]) => ({
            category,
            rating: scores.reduce((a, b) => a + b, 0) / scores.length
        }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);

    return { issues, strengths };
}

function isNegativeKeyword(keyword: string): boolean {
    const negativeWords = ['issue', 'problem', 'dirty', 'broken', 'noise', 'cold', 'hot', 'smell', 'uncomfortable'];
    return negativeWords.some(word => keyword.includes(word));
}