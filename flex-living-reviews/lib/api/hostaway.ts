// lib/api/hostaway.ts
import { Review, NormalizedReview } from '@/lib/types/review';
import mockReviews from '@/data/mock-reviews.json';

const HOSTAWAY_BASE_URL = 'https://api.hostaway.com/v1';
const HOSTAWAY_TOKEN_URL = 'https://api.hostaway.com/v1/accessTokens';
const ACCOUNT_ID = process.env.HOSTAWAY_ACCOUNT_ID;
const CLIENT_SECRET = process.env.HOSTAWAY_API_KEY;

// Cache for access token (in production, use Redis or similar)
let accessTokenCache: { token: string; expiresAt: number } | null = null;

export class HostawayAPI {
    private baseHeaders: HeadersInit;

    constructor() {
        this.baseHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Get a valid access token using OAuth2 client credentials flow
     */
    private async getAccessToken(): Promise<string | null> {
        // Check if we have a valid cached token
        if (accessTokenCache && accessTokenCache.expiresAt > Date.now()) {
            return accessTokenCache.token;
        }

        try {
            const response = await fetch(HOSTAWAY_TOKEN_URL, {
                method: 'POST',
                headers: {
                    'Cache-control': 'no-cache',
                    'Content-type': 'application/x-www-form-urlencoded'
                },
                body: `grant_type=client_credentials&client_id=${ACCOUNT_ID}&client_secret=${CLIENT_SECRET}&scope=general`
            });

            if (response.ok) {
                const data = await response.json();
                const expiresAt = Date.now() + (data.expires_in * 1000) - 60000; // Subtract 1 minute for safety
                
                accessTokenCache = {
                    token: data.access_token,
                    expiresAt
                };
                
                console.log('Successfully obtained Hostaway access token');
                return data.access_token;
            } else {
                console.error('Failed to get access token:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Failed to get Hostaway access token:', error);
        }

        return null;
    }

    /**
     * Get headers with authentication
     */
    private async getAuthHeaders(): Promise<Record<string, string>> {
        const token = await this.getAccessToken();
        return {
            ...this.baseHeaders,
            ...(token && { 'Authorization': `Bearer ${token}` })
        } as Record<string, string>;
    }

    /**
     * Fetch reviews from Hostaway API
     * Falls back to mock data if API returns empty or fails
     */
    async fetchReviews(params?: {
        listingId?: string;
        limit?: number;
        offset?: number;
    }): Promise<NormalizedReview[]> {
        try {
            const headers = await this.getAuthHeaders();
            
            // If no authentication, fall back to mock data
            if (!headers.Authorization) {
                console.log('No authentication available, using mock data');
                return this.getMockReviews(params?.listingId);
            }

            // Build query parameters (following Hostaway API format)
            const queryParams = new URLSearchParams();
            if (params?.limit) queryParams.set('limit', params.limit.toString());
            if (params?.offset) queryParams.set('offset', params.offset.toString());
            if (params?.listingId) queryParams.set('listingId', params.listingId);
            
            // Add other standard parameters if needed
            queryParams.set('sortOrder', 'desc');

            const response = await fetch(
                `${HOSTAWAY_BASE_URL}/reviews?${queryParams}`,
                {
                    method: 'GET',
                    headers,
                    cache: 'no-store'
                }
            );

            if (!response.ok) {
                console.warn(`Hostaway API returned ${response.status}, using mock data`);
                return this.getMockReviews(params?.listingId);
            }

            const data = await response.json();

            // Check if we got actual reviews
            if (!data.result || data.result.length === 0) {
                console.log('No reviews from Hostaway API, using mock data');
                return this.getMockReviews(params?.listingId);
            }

            // Normalize the reviews
            return data.result.map((review: any) => this.normalizeReview(review));

        } catch (error) {
            console.error('Failed to fetch from Hostaway API:', error);
            return this.getMockReviews(params?.listingId);
        }
    }

    /**
     * Get mock reviews as fallback
     */
    private getMockReviews(listingId?: string): NormalizedReview[] {
        let reviews = mockReviews.reviews;

        if (listingId) {
            reviews = reviews.filter(r =>
                this.extractListingId(r.listingName) === listingId
            );
        }

        return reviews.map(review => this.normalizeReview(review));
    }

    /**
     * Normalize a review from Hostaway format to our standard format
     */
    private normalizeReview(review: any): NormalizedReview {
        const categories = review.reviewCategory || [];

        // Calculate average rating from categories
        const averageRating = this.calculateAverageRating(categories);

        // Determine sentiment
        const sentiment = this.determineSentiment(averageRating, review.publicReview);

        // Extract keywords from review text
        const keywords = this.extractKeywords(review.publicReview || '');

        // Extract listing ID from name
        const listingId = this.extractListingId(review.listingName || '');

        return {
            id: String(review.id),
            type: review.type || 'guest-to-host',
            status: review.status || 'published',
            rating: review.rating || null,
            overallRating: averageRating,
            publicReview: review.publicReview || '',
            privateReview: review.privateReview,
            reviewCategory: categories,
            submittedAt: review.submittedAt,
            guestName: review.guestName,
            listingId,
            listingName: review.listingName,
            channel: review.channel || this.inferChannel(review),
            isApprovedForWebsite: false,
            sentiment,
            keywords,
            normalizedDate: new Date(review.submittedAt),
            averageRating
        };
    }

    /**
     * Calculate average rating from category ratings
     */
    private calculateAverageRating(categories: any[]): number {
        if (!categories || categories.length === 0) return 0;

        const sum = categories.reduce((total, cat) => {
            // Convert 10-point scale to 5-point scale
            return total + (cat.rating / 2);
        }, 0);

        return sum / categories.length;
    }

    /**
     * Determine sentiment based on rating and text analysis
     */
    private determineSentiment(rating: number, text: string): 'positive' | 'neutral' | 'negative' {
        // Simple sentiment based on rating
        if (rating >= 4) return 'positive';
        if (rating < 3) return 'negative';

        // Enhance with text analysis
        const negativeWords = ['terrible', 'awful', 'bad', 'poor', 'dirty', 'broken', 'disappointing'];
        const positiveWords = ['excellent', 'amazing', 'great', 'wonderful', 'perfect', 'beautiful', 'fantastic'];

        const lowerText = text.toLowerCase();
        const hasNegative = negativeWords.some(word => lowerText.includes(word));
        const hasPositive = positiveWords.some(word => lowerText.includes(word));

        if (hasNegative && !hasPositive) return 'negative';
        if (hasPositive && !hasNegative) return 'positive';

        return 'neutral';
    }

    /**
     * Extract keywords from review text
     */
    private extractKeywords(text: string): string[] {
        // Remove common words
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'was', 'is', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
            'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their', 'this', 'that'
        ]);

        // Extract words
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.has(word));

        // Count frequency
        const frequency: Record<string, number> = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });

        // Return top 5 most frequent words
        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);
    }

    /**
     * Extract listing ID from listing name
     */
    private extractListingId(listingName: string): string {
        // Pattern: "2B N1 A - 29 Shoreditch Heights" -> "2B-N1-A"
        const match = listingName.match(/^(\w+\s\w+\s\w+)/);
        if (match) {
            return match[1].replace(/\s/g, '-');
        }
        return listingName.split(' - ')[0].replace(/\s/g, '-');
    }

    /**
     * Infer channel from review data if not provided
     */
    private inferChannel(review: any): string {
        // Check for channel-specific patterns in the review data
        if (review.source) {
            const source = review.source.toLowerCase();
            if (source.includes('airbnb')) return 'airbnb';
            if (source.includes('booking')) return 'booking';
            if (source.includes('vrbo')) return 'vrbo';
            if (source.includes('expedia')) return 'expedia';
        }

        // Default to hostaway
        return 'hostaway';
    }


    /**
     * Fetch listings from Hostaway
     */
    async fetchListings(): Promise<any[]> {
        try {
            const headers = await this.getAuthHeaders();
            
            // If no authentication, fall back to mock data
            if (!headers.Authorization) {
                console.log('No authentication available, using mock listings');
                return this.getMockListings();
            }

            // Build query parameters (following Hostaway API format)
            const queryParams = new URLSearchParams();
            queryParams.set('limit', '');
            queryParams.set('offset', '');
            queryParams.set('sortOrder', '');
            queryParams.set('city', '');
            queryParams.set('match', '');
            queryParams.set('country', '');
            queryParams.set('contactName', '');
            queryParams.set('propertyTypeId', '');

            const response = await fetch(
                `${HOSTAWAY_BASE_URL}/listings?${queryParams}`,
                {
                    method: 'GET',
                    headers
                }
            );

            if (!response.ok) {
                console.error('Failed to fetch listings');
                return this.getMockListings();
            }

            const data = await response.json();
            return data.result || this.getMockListings();

        } catch (error) {
            console.error('Error fetching listings:', error);
            return this.getMockListings();
        }
    }

    /**
     * Get mock listings
     */
    private getMockListings(): any[] {
        return [
            {
                id: '2B-N1-A',
                name: '2B N1 A - 29 Shoreditch Heights',
                address: 'Shoreditch, London',
                type: 'apartment'
            },
            {
                id: '2B-N1-B',
                name: '2B N1 B - 29 Shoreditch Heights',
                address: 'Shoreditch, London',
                type: 'apartment'
            },
            {
                id: '3B-S2-A',
                name: '3B S2 A - 15 Southbank Residences',
                address: 'Southbank, London',
                type: 'apartment'
            }
        ];
    }
}

// Export singleton instance
export const hostawayAPI = new HostawayAPI();