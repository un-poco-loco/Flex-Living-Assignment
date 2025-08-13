// lib/types/review.ts
export interface Review {
    id: string;
    type: 'host-to-guest' | 'guest-to-host';
    status: 'published' | 'pending' | 'hidden';
    rating: number | null;
    overallRating?: number;
    publicReview: string;
    privateReview?: string;
    reviewCategory: ReviewCategory[];
    submittedAt: string;
    guestName: string;
    listingId: string;
    listingName: string;
    channel: 'hostaway' | 'airbnb' | 'booking' | 'vrbo' | 'google' | 'direct';
    isApprovedForWebsite?: boolean;
    sentiment?: 'positive' | 'neutral' | 'negative';
    keywords?: string[];
}

export interface ReviewCategory {
    category: string;
    rating: number;
}

export interface NormalizedReview extends Review {
    normalizedDate: Date;
    averageRating: number;
}

export interface DashboardFilters {
    listingId?: string;
    channel?: string;
    dateRange?: { start: Date; end: Date };
    minRating?: number;
    sentiment?: string;
    isApprovedForWebsite?: boolean;
}

export interface PropertyStats {
    totalReviews: number;
    averageRating: number;
    categoryAverages: Record<string, number>;
    trendData: { date: string; rating: number; count: number }[];
    sentimentBreakdown: Record<string, number>;
}