// lib/hooks/useProperties.ts
import { useMemo } from 'react';
import { useReviews } from './useReviews';
import { Review } from '@/lib/types/review';

interface PropertySummary {
    id: string;
    name: string;
    location: string;
    price: string;
    type: string;
    bedrooms: number;
    bathrooms: number;
    maxGuests: number;
    totalReviews: number;
    averageRating: number;
    approvalRate: number;
    recentTrend: 'up' | 'down' | 'stable';
}

// Static property data (could be moved to a config file)
const PROPERTY_DATA = {
    '2B-N1-A': { 
        name: '2B N1 A - 29 Shoreditch Heights', 
        location: 'Shoreditch, London', 
        price: '£150', 
        type: 'Entire apartment', 
        bedrooms: 2, 
        bathrooms: 1, 
        maxGuests: 4 
    },
    '2B-N1-B': { 
        name: '2B N1 B - 29 Shoreditch Heights', 
        location: 'Shoreditch, London', 
        price: '£145', 
        type: 'Entire apartment', 
        bedrooms: 2, 
        bathrooms: 1, 
        maxGuests: 4 
    },
    '3B-S2-A': { 
        name: '3B S2 A - 15 Southbank Residences', 
        location: 'Southbank, London', 
        price: '£220', 
        type: 'Entire apartment', 
        bedrooms: 3, 
        bathrooms: 2, 
        maxGuests: 6 
    },
    '1B-E3-C': { 
        name: '1B E3 C - 42 East Village', 
        location: 'East Village, London', 
        price: '£110', 
        type: 'Entire apartment', 
        bedrooms: 1, 
        bathrooms: 1, 
        maxGuests: 2 
    }
} as const;

function calculatePropertySummary(
    propertyId: string, 
    propertyData: typeof PROPERTY_DATA[keyof typeof PROPERTY_DATA],
    reviews: Review[]
): PropertySummary {
    const propertyReviews = reviews.filter(r => r.listingId === propertyId);
    const totalReviews = propertyReviews.length;
    const averageRating = totalReviews > 0 
        ? propertyReviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / totalReviews 
        : 0;
    
    const approvedReviews = propertyReviews.filter(r => r.isApprovedForWebsite).length;
    const approvalRate = totalReviews > 0 ? (approvedReviews / totalReviews) * 100 : 0;

    // Simple trend calculation
    const recentTrend: 'up' | 'down' | 'stable' = 
        averageRating >= 4.5 ? 'up' : 
        averageRating < 4 ? 'down' : 
        'stable';

    return {
        id: propertyId,
        ...propertyData,
        totalReviews,
        averageRating,
        approvalRate,
        recentTrend
    };
}

export function useProperties() {
    const { reviews, isLoading, error, mutate } = useReviews({}, {
        // Cache properties data for longer since it changes less frequently
        dedupingInterval: 10 * 60 * 1000, // 10 minutes
        refreshInterval: 15 * 60 * 1000, // 15 minutes
        revalidateOnFocus: false, // Don't revalidate on focus for properties overview
    });

    // Memoize the property calculations to avoid recalculating on every render
    const properties = useMemo(() => {
        if (!reviews.length) return [];

        return Object.entries(PROPERTY_DATA).map(([id, data]) => 
            calculatePropertySummary(id, data, reviews)
        );
    }, [reviews]);

    // Memoize summary stats
    const summaryStats = useMemo(() => {
        if (!properties.length) return {
            totalProperties: 0,
            totalReviews: 0,
            averageRating: 0,
            totalApproved: 0
        };

        return {
            totalProperties: properties.length,
            totalReviews: properties.reduce((sum, p) => sum + p.totalReviews, 0),
            averageRating: properties.reduce((sum, p, _, arr) => sum + p.averageRating, 0) / properties.length,
            totalApproved: reviews.filter(r => r.isApprovedForWebsite).length
        };
    }, [properties, reviews]);

    return {
        properties,
        summaryStats,
        isLoading,
        error,
        refresh: () => mutate(),
        hasData: properties.length > 0
    };
}

export function useProperty(propertyId: string) {
    const { reviews, isLoading, error, mutate } = useReviews({ listingId: propertyId });
    
    const propertyData = PROPERTY_DATA[propertyId as keyof typeof PROPERTY_DATA];
    
    const property = useMemo(() => {
        if (!propertyData) return null;
        return calculatePropertySummary(propertyId, propertyData, reviews);
    }, [propertyId, propertyData, reviews]);

    const approvedReviews = useMemo(() => 
        reviews.filter(r => r.isApprovedForWebsite), 
        [reviews]
    );

    return {
        property,
        reviews: approvedReviews,
        allReviews: reviews,
        isLoading,
        error,
        refresh: () => mutate(),
        hasData: !!property
    };
}