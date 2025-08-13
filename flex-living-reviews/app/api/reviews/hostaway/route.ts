// app/api/reviews/hostaway/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { hostawayAPI } from '@/lib/api/hostaway';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
import { 
    isReviewApproved, 
    approveReview, 
    disapproveReview, 
    getAllApprovedReviews 
} from '@/lib/db/approved-reviews';

export async function GET(request: NextRequest) {
    try {
        // Parse query parameters
        const searchParams = request.nextUrl.searchParams;
        const params = {
            listingId: searchParams.get('listingId') || undefined,
            limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
            offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
        };

        // Fetch reviews using the consolidated API
        const normalizedReviews = await hostawayAPI.fetchReviews(params);

        // Apply additional filters
        let filteredReviews = normalizedReviews;

        if (searchParams.get('channel')) {
            filteredReviews = filteredReviews.filter(r =>
                r.channel === searchParams.get('channel')
            );
        }

        if (searchParams.get('minRating')) {
            const minRating = parseFloat(searchParams.get('minRating')!);
            filteredReviews = filteredReviews.filter(r =>
                r.averageRating >= minRating
            );
        }

        if (searchParams.get('sentiment')) {
            filteredReviews = filteredReviews.filter(r =>
                r.sentiment === searchParams.get('sentiment')
            );
        }

        if (searchParams.get('dateRange')) {
            const days = parseInt(searchParams.get('dateRange')!);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            filteredReviews = filteredReviews.filter(r =>
                r.normalizedDate >= cutoffDate
            );
        }

        // Apply approval status filter
        const approvedReviews = await getAllApprovedReviews();
        filteredReviews = await Promise.all(
            filteredReviews.map(async (review) => ({
                ...review,
                isApprovedForWebsite: approvedReviews.has(review.id)
            }))
        );

        // Sort by date (newest first)
        filteredReviews.sort((a, b) =>
            b.normalizedDate.getTime() - a.normalizedDate.getTime()
        );

        return NextResponse.json({
            status: 'success',
            result: filteredReviews,
            meta: {
                total: filteredReviews.length,
                source: normalizedReviews.length > 0 ? 
                    (normalizedReviews.some(r => r.id.startsWith('mock-')) ? 'mock' : 'api') : 'mock'
            }
        });

    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json(
            { status: 'error', message: 'Failed to fetch reviews' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { reviewId, updates } = body;

        let approvedCount: number;

        // Handle approval updates
        if (updates.isApprovedForWebsite === true) {
            approvedCount = await approveReview(reviewId);
            console.log(`Review ${reviewId} approved for website. Total approved: ${approvedCount}`);
        } else if (updates.isApprovedForWebsite === false) {
            approvedCount = await disapproveReview(reviewId);
            console.log(`Review ${reviewId} removed from website approval. Total approved: ${approvedCount}`);
        } else {
            // Get current count for other types of updates
            const approvedReviews = await getAllApprovedReviews();
            approvedCount = approvedReviews.size;
        }

        return NextResponse.json({
            status: 'success',
            message: 'Review updated successfully',
            reviewId,
            updates,
            approvedCount
        });
    } catch (error) {
        console.error('Error updating review:', error);
        return NextResponse.json(
            { status: 'error', message: 'Failed to update review' },
            { status: 500 }
        );
    }
}