// lib/api/google.ts
import { NormalizedReview } from '@/lib/types/review';

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

export class GooglePlacesAPI {
    private apiKey: string | undefined;

    constructor() {
        this.apiKey = GOOGLE_PLACES_API_KEY;
    }

    /**
     * Check if Google Places API is configured
     */
    isConfigured(): boolean {
        return !!this.apiKey;
    }

    /**
     * Search for a place by name or address
     */
    async searchPlace(query: string): Promise<{
        placeId: string;
        name: string;
        address: string;
        rating?: number;
    } | null> {
        if (!this.isConfigured()) {
            console.warn('Google Places API key not configured');
            return null;
        }

        try {
            const url = `${GOOGLE_PLACES_BASE_URL}/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.status !== 'OK' || !data.results || data.results.length === 0) {
                console.error('Place not found:', data.status);
                return null;
            }

            const place = data.results[0];
            return {
                placeId: place.place_id,
                name: place.name,
                address: place.formatted_address,
                rating: place.rating
            };

        } catch (error) {
            console.error('Error searching for place:', error);
            return null;
        }
    }

    /**
     * Fetch reviews for a place
     */
    async fetchReviews(placeId: string): Promise<NormalizedReview[]> {
        if (!this.isConfigured()) {
            return [];
        }

        try {
            const fields = 'name,rating,reviews,user_ratings_total';
            const url = `${GOOGLE_PLACES_BASE_URL}/details/json?place_id=${placeId}&fields=${fields}&key=${this.apiKey}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.status !== 'OK' || !data.result) {
                console.error('Failed to fetch place details:', data.status);
                return [];
            }

            const place = data.result;

            // Google Places API returns maximum 5 reviews
            if (!place.reviews || place.reviews.length === 0) {
                return [];
            }

            return place.reviews.map((review: any, index: number) =>
                this.normalizeGoogleReview(review, placeId, place.name, index)
            );

        } catch (error) {
            console.error('Error fetching Google reviews:', error);
            return [];
        }
    }

    /**
     * Normalize Google review to our format
     */
    private normalizeGoogleReview(
        review: any,
        placeId: string,
        placeName: string,
        index: number
    ): NormalizedReview {
        const rating = review.rating || 0;
        const submittedAt = new Date(review.time * 1000).toISOString();

        return {
            id: `google-${placeId}-${index}`,
            type: 'guest-to-host',
            status: 'published',
            rating,
            overallRating: rating,
            publicReview: review.text || '',
            reviewCategory: [], // Google doesn't provide category breakdowns
            submittedAt,
            guestName: review.author_name,
            listingId: placeId,
            listingName: placeName,
            channel: 'google',
            isApprovedForWebsite: false,
            sentiment: this.determineSentiment(rating),
            keywords: this.extractKeywords(review.text || ''),
            normalizedDate: new Date(submittedAt),
            averageRating: rating
        };
    }

    /**
     * Determine sentiment from rating
     */
    private determineSentiment(rating: number): 'positive' | 'neutral' | 'negative' {
        if (rating >= 4) return 'positive';
        if (rating >= 3) return 'neutral';
        return 'negative';
    }

    /**
     * Extract keywords from text
     */
    private extractKeywords(text: string): string[] {
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'was', 'is', 'are', 'were', 'been', 'be', 'have', 'has', 'had'
        ]);

        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.has(word));

        const frequency: Record<string, number> = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });

        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);
    }

    /**
     * Map property to Google Place
     * This would typically be stored in a database
     */
    async mapPropertyToPlace(propertyId: string, propertyName: string): Promise<string | null> {
        // In production, check if we already have a mapping
        const existingMapping = this.getExistingMapping(propertyId);
        if (existingMapping) {
            return existingMapping;
        }

        // Search for the property on Google
        const place = await this.searchPlace(propertyName);
        if (place) {
            // Store the mapping (in production, save to database)
            this.saveMapping(propertyId, place.placeId);
            return place.placeId;
        }

        return null;
    }

    /**
     * Get existing property-to-place mapping
     * In production, this would query a database
     */
    private getExistingMapping(propertyId: string): string | null {
        // Mock mappings for demo
        const mappings: Record<string, string> = {
            '2B-N1-A': 'ChIJN1t_tDeuEmsRUsoyG83frY4',
            '2B-N1-B': 'ChIJN1t_tDeuEmsRUsoyG83frY5',
            '3B-S2-A': 'ChIJN1t_tDeuEmsRUsoyG83frY6'
        };

        return mappings[propertyId] || null;
    }

    /**
     * Save property-to-place mapping
     * In production, this would save to a database
     */
    private saveMapping(propertyId: string, placeId: string): void {
        // In production, save to database
        console.log(`Mapped property ${propertyId} to Google Place ${placeId}`);
    }

    /**
     * Get integration status and capabilities
     */
    getIntegrationInfo(): {
        configured: boolean;
        capabilities: string[];
        limitations: string[];
        recommendations: string[];
    } {
        return {
            configured: this.isConfigured(),
            capabilities: [
                'Search for properties by name/address',
                'Fetch up to 5 most relevant reviews',
                'Get overall place rating',
                'Access review author names and timestamps'
            ],
            limitations: [
                'Maximum 5 reviews per place',
                'Cannot write or respond to reviews',
                'Reviews sorted by Google\'s relevance algorithm',
                'Requires property to be listed on Google Maps',
                'API costs apply after free tier'
            ],
            recommendations: [
                'Cache reviews to minimize API calls',
                'Implement property-to-place mapping table',
                'Use webhooks for new review notifications if available',
                'Combine with other review sources for complete picture'
            ]
        };
    }
}

// Export singleton instance
export const googlePlacesAPI = new GooglePlacesAPI();