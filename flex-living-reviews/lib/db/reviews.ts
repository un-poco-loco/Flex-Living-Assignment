// lib/db/reviews.ts
import {NormalizedReview} from '@/lib/types/review';

// In a production app, this would connect to a real database
// For this assessment, we're using in-memory storage with localStorage fallback

class ReviewsDatabase {
    private reviews: Map<string, NormalizedReview> = new Map();
    private approvedReviews: Set<string> = new Set();

    constructor() {
        // Initialize from localStorage if available (browser only)
        if (typeof window !== 'undefined') {
            this.loadFromLocalStorage();
        }
    }

    private loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('flex_reviews_db');
            if (stored) {
                const data = JSON.parse(stored);
                this.reviews = new Map(data.reviews);
                this.approvedReviews = new Set(data.approved);
            }
        } catch (error) {
            console.error('Failed to load reviews from localStorage:', error);
        }
    }

    private saveToLocalStorage() {
        if (typeof window !== 'undefined') {
            try {
                const data = {
                    reviews: Array.from(this.reviews.entries()),
                    approved: Array.from(this.approvedReviews)
                };
                localStorage.setItem('flex_reviews_db', JSON.stringify(data));
            } catch (error) {
                console.error('Failed to save reviews to localStorage:', error);
            }
        }
    }

    // Create or update a review
    async upsertReview(review: NormalizedReview): Promise<void> {
        this.reviews.set(review.id, review);

        // If the review is approved for website, add to approved set
        if (review.isApprovedForWebsite) {
            this.approvedReviews.add(review.id);
        } else {
            this.approvedReviews.delete(review.id);
        }

        this.saveToLocalStorage();
    }

    // Bulk upsert reviews
    async upsertBulkReviews(reviews: NormalizedReview[]): Promise<void> {
        reviews.forEach(review => {
            this.reviews.set(review.id, review);
            if (review.isApprovedForWebsite) {
                this.approvedReviews.add(review.id);
            }
        });
        this.saveToLocalStorage();
    }

    // Get a single review by ID
    async getReview(id: string): Promise<NormalizedReview | null> {
        return this.reviews.get(id) || null;
    }

    // Get all reviews with optional filters
    async getReviews(filters?: {
        listingId?: string;
        channel?: string;
        isApprovedForWebsite?: boolean;
        minRating?: number;
        sentiment?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<NormalizedReview[]> {
        let reviews = Array.from(this.reviews.values());

        if (filters) {
            if (filters.listingId) {
                reviews = reviews.filter(r => r.listingId === filters.listingId);
            }
            if (filters.channel) {
                reviews = reviews.filter(r => r.channel === filters.channel);
            }
            if (filters.isApprovedForWebsite !== undefined) {
                reviews = reviews.filter(r => r.isApprovedForWebsite === filters.isApprovedForWebsite);
            }
            if (filters.minRating) {
                reviews = reviews.filter(r => (r.averageRating || 0) >= filters.minRating!);
            }
            if (filters.sentiment) {
                reviews = reviews.filter(r => r.sentiment === filters.sentiment);
            }
            if (filters.dateFrom) {
                reviews = reviews.filter(r => new Date(r.submittedAt) >= filters.dateFrom!);
            }
            if (filters.dateTo) {
                reviews = reviews.filter(r => new Date(r.submittedAt) <= filters.dateTo!);
            }
        }

        return reviews;
    }

    // Approve reviews for website display
    async approveReviewsForWebsite(reviewIds: string[]): Promise<void> {
        reviewIds.forEach(id => {
            const review = this.reviews.get(id);
            if (review) {
                review.isApprovedForWebsite = true;
                this.reviews.set(id, review);
                this.approvedReviews.add(id);
            }
        });
        this.saveToLocalStorage();
    }

    // Reject reviews from website display
    async rejectReviewsFromWebsite(reviewIds: string[]): Promise<void> {
        reviewIds.forEach(id => {
            const review = this.reviews.get(id);
            if (review) {
                review.isApprovedForWebsite = false;
                this.reviews.set(id, review);
                this.approvedReviews.delete(id);
            }
        });
        this.saveToLocalStorage();
    }

    // Get reviews grouped by listing
    async getReviewsByListing(): Promise<Map<string, NormalizedReview[]>> {
        const grouped = new Map<string, NormalizedReview[]>();

        this.reviews.forEach(review => {
            const listingId = review.listingId || 'unknown';
            if (!grouped.has(listingId)) {
                grouped.set(listingId, []);
            }
            grouped.get(listingId)!.push(review);
        });

        return grouped;
    }

    // Get review statistics
    async getStatistics(listingId?: string): Promise<{
        totalReviews: number;
        averageRating: number;
        approvedCount: number;
        pendingCount: number;
        channelBreakdown: Record<string, number>;
        sentimentBreakdown: Record<string, number>;
        monthlyTrend: Array<{ month: string; count: number; averageRating: number }>;
    }> {
        let reviews = await this.getReviews(listingId ? {listingId} : undefined);

        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((sum, r) => sum + (r.averageRating || 0), 0) / totalReviews
            : 0;

        const approvedCount = reviews.filter(r => r.isApprovedForWebsite).length;
        const pendingCount = totalReviews - approvedCount;

        // Channel breakdown
        const channelBreakdown: Record<string, number> = {};
        reviews.forEach(r => {
            channelBreakdown[r.channel] = (channelBreakdown[r.channel] || 0) + 1;
        });

        // Sentiment breakdown
        const sentimentBreakdown: Record<string, number> = {};
        reviews.forEach(r => {
            const sentiment = r.sentiment || 'neutral';
            sentimentBreakdown[sentiment] = (sentimentBreakdown[sentiment] || 0) + 1;
        });

        // Monthly trend (last 12 months)
        const monthlyTrend = this.calculateMonthlyTrend(reviews);

        return {
            totalReviews,
            averageRating,
            approvedCount,
            pendingCount,
            channelBreakdown,
            sentimentBreakdown,
            monthlyTrend
        };
    }

    private calculateMonthlyTrend(reviews: NormalizedReview[]): Array<{
        month: string;
        count: number;
        averageRating: number
    }> {
        const months: Map<string, { count: number; totalRating: number }> = new Map();
        const now = new Date();

        // Initialize last 12 months
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
            months.set(monthKey, {count: 0, totalRating: 0});
        }

        // Aggregate reviews by month
        reviews.forEach(review => {
            const monthKey = review.submittedAt.substring(0, 7);
            if (months.has(monthKey)) {
                const data = months.get(monthKey)!;
                data.count++;
                data.totalRating += review.averageRating || 0;
            }
        });

        // Convert to array
        return Array.from(months.entries()).map(([month, data]) => ({
            month,
            count: data.count,
            averageRating: data.count > 0 ? data.totalRating / data.count : 0
        }));
    }

    // Clear all data (useful for testing)
    async clearAll(): Promise<void> {
        this.reviews.clear();
        this.approvedReviews.clear();
        if (typeof window !== 'undefined') {
            localStorage.removeItem('flex_reviews_db');
        }
    }
}

// Export singleton instance
export const reviewsDB = new ReviewsDatabase();