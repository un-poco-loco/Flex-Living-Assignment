// app/api/reviews/google/route.ts
import {NextRequest, NextResponse} from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Google Places API configuration
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const placeId = searchParams.get('placeId');

        if (!GOOGLE_API_KEY) {
            return NextResponse.json({
                status: 'error',
                message: 'Google API key not configured',
                findings: {
                    feasible: false,
                    reason: 'API key required',
                    implementation: 'Set GOOGLE_PLACES_API_KEY environment variable',
                    limitations: [
                        'Requires Google Cloud Platform account',
                        'Places API must be enabled',
                        'Billing account required for production use',
                        'Rate limits apply (1 request per second for free tier)'
                    ]
                }
            });
        }

        if (!placeId) {
            // Return exploration findings if no placeId provided
            return NextResponse.json({
                status: 'success',
                findings: {
                    feasible: true,
                    implementation: 'Google Reviews can be integrated via Places API',
                    steps: [
                        '1. Enable Places API in Google Cloud Console',
                        '2. Use Place Search to find property by name/address',
                        '3. Use Place Details to fetch reviews',
                        '4. Reviews include rating, text, author, and time'
                    ],
                    dataStructure: {
                        rating: 'number (1-5)',
                        text: 'string',
                        author_name: 'string',
                        time: 'unix timestamp',
                        profile_photo_url: 'string (optional)'
                    },
                    limitations: [
                        'Maximum 5 reviews per place',
                        'Cannot write reviews via API',
                        'Reviews are sorted by Google relevance algorithm',
                        'Requires place to be listed on Google Maps'
                    ],
                    costs: {
                        placeDetails: '$17 per 1000 requests',
                        placeSearch: '$32 per 1000 requests'
                    }
                }
            });
        }

        // Fetch place details including reviews
        const detailsUrl = `${GOOGLE_PLACES_API_URL}/details/json?place_id=${placeId}&fields=name,rating,reviews&key=${GOOGLE_API_KEY}`;

        const response = await fetch(detailsUrl);
        const data = await response.json();

        if (data.status !== 'OK') {
            return NextResponse.json({
                status: 'error',
                message: `Google API error: ${data.status}`,
                error_message: data.error_message
            });
        }

        // Transform Google reviews to our format
        const normalizedReviews = (data.result.reviews || []).map((review: any, index: number) => ({
            id: `google-${placeId}-${index}`,
            type: 'guest-to-host',
            status: 'published',
            rating: review.rating,
            averageRating: review.rating,
            publicReview: review.text || '',
            reviewCategory: [],
            submittedAt: new Date(review.time * 1000).toISOString(),
            guestName: review.author_name,
            listingId: placeId,
            listingName: data.result.name,
            channel: 'google',
            sentiment: review.rating >= 4 ? 'positive' : review.rating >= 3 ? 'neutral' : 'negative',
            keywords: []
        }));

        return NextResponse.json({
            status: 'success',
            result: normalizedReviews,
            meta: {
                source: 'google',
                placeId,
                placeName: data.result.name,
                placeRating: data.result.rating,
                totalReviews: normalizedReviews.length
            }
        });

    } catch (error) {
        console.error('Error fetching Google reviews:', error);
        return NextResponse.json(
            {
                status: 'error',
                message: 'Failed to fetch Google reviews',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            {status: 500}
        );
    }
}