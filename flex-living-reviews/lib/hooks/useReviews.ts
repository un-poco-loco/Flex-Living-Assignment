// lib/hooks/useReviews.ts
import useSWR, { SWRConfiguration } from 'swr';
import { Review } from '@/lib/types/review';

interface ReviewsResponse {
    status: string;
    result: Review[];
    meta: {
        total: number;
        source: string;
        breakdown?: any;
    };
}

interface ReviewFilters {
    listingId?: string;
    channel?: string;
    minRating?: number;
    sentiment?: string;
    dateRange?: number;
    limit?: number;
    offset?: number;
}

// Custom fetcher function
const fetcher = async (url: string): Promise<ReviewsResponse> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

// Custom hook for fetching reviews with caching
export function useReviews(filters: ReviewFilters = {}, options: SWRConfiguration = {}) {
    const params = new URLSearchParams();
    
    // Build query parameters
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
        }
    });

    const url = `/api/reviews/hostaway?${params.toString()}`;
    
    const {
        data,
        error,
        mutate,
        isLoading,
        isValidating
    } = useSWR<ReviewsResponse>(
        url,
        fetcher,
        {
            // Cache for 30 minutes to reduce API calls
            dedupingInterval: 30 * 60 * 1000,
            // Don't revalidate on focus to prevent excessive calls
            revalidateOnFocus: false,
            // No automatic background refresh - only manual refresh
            refreshInterval: 0,
            // Don't retry on 4xx errors
            shouldRetryOnError: (error) => {
                return error.status >= 500;
            },
            // Reduce error retry count
            errorRetryCount: 1,
            // Error retry interval
            errorRetryInterval: 5000,
            // Keep previous data while loading new data
            keepPreviousData: true,
            // Don't revalidate on mount if data exists
            revalidateIfStale: false,
            ...options
        }
    );

    return {
        reviews: data?.result || [],
        meta: data?.meta,
        isLoading,
        isValidating,
        error,
        mutate,
        // Helper to refresh data
        refresh: () => mutate(),
        // Helper to check if data exists
        hasData: !!data,
        // Helper for total count
        totalCount: data?.meta?.total || 0
    };
}

// Hook for aggregated reviews (all sources)
export function useAggregatedReviews(filters: ReviewFilters = {}, options: SWRConfiguration = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
        }
    });

    const url = `/api/reviews/all?${params.toString()}`;
    
    const {
        data,
        error,
        mutate,
        isLoading,
        isValidating
    } = useSWR<ReviewsResponse>(
        url,
        fetcher,
        {
            dedupingInterval: 30 * 60 * 1000, // 30 minutes for aggregated data
            revalidateOnFocus: false,
            refreshInterval: 0, // No background refresh
            shouldRetryOnError: (error) => error.status >= 500,
            errorRetryCount: 1,
            errorRetryInterval: 5000,
            keepPreviousData: true,
            revalidateIfStale: false,
            ...options
        }
    );

    return {
        reviews: data?.result || [],
        meta: data?.meta,
        isLoading,
        isValidating,
        error,
        mutate,
        refresh: () => mutate(),
        hasData: !!data,
        totalCount: data?.meta?.total || 0
    };
}

// Hook specifically for property pages (approved reviews only)
export function usePropertyReviews(listingId: string, options: SWRConfiguration = {}) {
    const { reviews, isLoading, error, mutate } = useReviews(
        { listingId },
        {
            // Cache longer for property pages since they change less frequently
            dedupingInterval: 10 * 60 * 1000, // 10 minutes
            refreshInterval: 15 * 60 * 1000, // 15 minutes
            ...options
        }
    );

    // Filter only approved reviews on client side for faster rendering
    const approvedReviews = reviews.filter(r => r.isApprovedForWebsite);

    return {
        reviews: approvedReviews,
        allReviews: reviews,
        isLoading,
        error,
        mutate,
        refresh: () => mutate(),
        totalApproved: approvedReviews.length,
        totalAll: reviews.length
    };
}