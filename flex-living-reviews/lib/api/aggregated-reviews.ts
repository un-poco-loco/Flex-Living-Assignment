// lib/api/aggregated-reviews.ts
import { NormalizedReview } from '@/lib/types/review';
import { hostawayAPI } from './hostaway';
import { googlePlacesAPI } from './google';

export interface AggregatedReviewsParams {
    listingId?: string;
    limit?: number;
    offset?: number;
    channel?: string;
    minRating?: number;
    sentiment?: string;
    dateRange?: number;
}

export class AggregatedReviewsAPI {
    /**
     * Fetch reviews from all configured sources
     */
    async fetchAllReviews(params?: AggregatedReviewsParams): Promise<{
        reviews: NormalizedReview[];
        sources: string[];
        meta: {
            hostaway: { enabled: boolean; reviews: number };
            google: { enabled: boolean; reviews: number };
        };
    }> {
        const results = await Promise.allSettled([
            this.fetchHostawayReviews(params),
            this.fetchGoogleReviews(params)
        ]);

        const hostawayResult = results[0];
        const googleResult = results[1];

        let allReviews: NormalizedReview[] = [];
        const sources: string[] = [];
        const meta = {
            hostaway: { enabled: false, reviews: 0 },
            google: { enabled: false, reviews: 0 }
        };

        // Process Hostaway results
        if (hostawayResult.status === 'fulfilled') {
            const hostawayReviews = hostawayResult.value;
            allReviews = allReviews.concat(hostawayReviews);
            sources.push('hostaway');
            meta.hostaway = { enabled: true, reviews: hostawayReviews.length };
        }

        // Process Google results
        if (googleResult.status === 'fulfilled') {
            const googleReviews = googleResult.value;
            allReviews = allReviews.concat(googleReviews);
            if (googleReviews.length > 0) {
                sources.push('google');
            }
            meta.google = { enabled: true, reviews: googleReviews.length };
        } else {
            // Google might not be configured
            meta.google = { enabled: false, reviews: 0 };
        }

        // Remove duplicates (if any) by ID
        const uniqueReviews = allReviews.reduce((acc, review) => {
            if (!acc.find(r => r.id === review.id)) {
                acc.push(review);
            }
            return acc;
        }, [] as NormalizedReview[]);

        // Sort by date (newest first)
        uniqueReviews.sort((a, b) => 
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );

        return {
            reviews: uniqueReviews,
            sources,
            meta
        };
    }

    /**
     * Fetch reviews from Hostaway
     */
    private async fetchHostawayReviews(params?: AggregatedReviewsParams): Promise<NormalizedReview[]> {
        try {
            return await hostawayAPI.fetchReviews({
                listingId: params?.listingId,
                limit: params?.limit,
                offset: params?.offset
            });
        } catch (error) {
            console.error('Failed to fetch Hostaway reviews:', error);
            return [];
        }
    }

    /**
     * Fetch reviews from Google Places
     */
    private async fetchGoogleReviews(params?: AggregatedReviewsParams): Promise<NormalizedReview[]> {
        try {
            if (!googlePlacesAPI.isConfigured()) {
                return [];
            }

            // If we have a specific listing ID, try to map it to a Google Place
            if (params?.listingId) {
                const placeId = await this.getGooglePlaceId(params.listingId);
                if (placeId) {
                    return await googlePlacesAPI.fetchReviews(placeId);
                }
            }

            return [];
        } catch (error) {
            console.error('Failed to fetch Google reviews:', error);
            return [];
        }
    }

    /**
     * Get Google Place ID for a property listing
     */
    private async getGooglePlaceId(listingId: string): Promise<string | null> {
        // Mock property mappings - in production, this would be in a database
        const propertyMappings: Record<string, { name: string; placeId?: string }> = {
            '2B-N1-A': { 
                name: '29 Shoreditch Heights, Shoreditch, London',
                placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4' // Example Place ID
            },
            '2B-N1-B': { 
                name: '29 Shoreditch Heights Unit B, Shoreditch, London',
                placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY5'
            },
            '3B-S2-A': { 
                name: '15 Southbank Residences, London',
                placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY6'
            }
        };

        const property = propertyMappings[listingId];
        if (!property) {
            return null;
        }

        // If we already have a Place ID, use it
        if (property.placeId) {
            return property.placeId;
        }

        // Otherwise, search for the property
        return await googlePlacesAPI.mapPropertyToPlace(listingId, property.name);
    }

    /**
     * Get integration status for all sources
     */
    async getIntegrationStatus() {
        const hostawayStatus = {
            name: 'Hostaway',
            configured: true,
            status: 'active'
        };

        const googleStatus = {
            name: 'Google Places',
            configured: googlePlacesAPI.isConfigured(),
            status: googlePlacesAPI.isConfigured() ? 'active' : 'not_configured'
        };

        const googleInfo = googlePlacesAPI.getIntegrationInfo();

        return {
            sources: [hostawayStatus, googleStatus],
            google: googleInfo
        };
    }
}

// Export singleton instance
export const aggregatedReviewsAPI = new AggregatedReviewsAPI();