// app/api/reviews/all/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { aggregatedReviewsAPI } from '@/lib/api/aggregated-reviews';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
import { 
    getAllApprovedReviews 
} from '@/lib/db/approved-reviews';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const params = {
            listingId: searchParams.get('listingId') || undefined,
            limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
            offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
            channel: searchParams.get('channel') || undefined,
            minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
            sentiment: searchParams.get('sentiment') || undefined,
            dateRange: searchParams.get('dateRange') ? parseInt(searchParams.get('dateRange')!) : undefined,
        };

        // Fetch reviews from all sources
        const { reviews, sources, meta } = await aggregatedReviewsAPI.fetchAllReviews(params);

        // Apply additional filters
        let filteredReviews = reviews;

        if (params.channel) {
            filteredReviews = filteredReviews.filter(r => r.channel === params.channel);
        }

        if (params.minRating) {
            filteredReviews = filteredReviews.filter(r => r.averageRating >= params.minRating!);
        }

        if (params.sentiment) {
            filteredReviews = filteredReviews.filter(r => r.sentiment === params.sentiment);
        }

        if (params.dateRange) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - params.dateRange);
            filteredReviews = filteredReviews.filter(r => 
                new Date(r.submittedAt) >= cutoffDate
            );
        }

        // Apply approval status
        const approvedReviews = await getAllApprovedReviews();
        filteredReviews = filteredReviews.map(review => ({
            ...review,
            isApprovedForWebsite: approvedReviews.has(review.id)
        }));

        return NextResponse.json({
            status: 'success',
            result: filteredReviews,
            meta: {
                total: filteredReviews.length,
                sources,
                breakdown: meta
            }
        });

    } catch (error) {
        console.error('Error fetching aggregated reviews:', error);
        return NextResponse.json(
            { status: 'error', message: 'Failed to fetch reviews' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { action } = await request.json();
        
        if (action === 'status') {
            const status = await aggregatedReviewsAPI.getIntegrationStatus();
            return NextResponse.json({
                status: 'success',
                result: status
            });
        }

        return NextResponse.json(
            { status: 'error', message: 'Unknown action' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error in aggregated reviews POST:', error);
        return NextResponse.json(
            { status: 'error', message: 'Internal server error' },
            { status: 500 }
        );
    }
}