'use client';

import React from 'react';
import {Bath, Bed, MapPin, Star, TrendingDown, TrendingUp, Users} from 'lucide-react';
import {useProperties} from '@/lib/hooks/useProperties';

// Memoized property card component
const PropertyCard = React.memo(({property}: { property: any }) => (
    <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <a
                        href={`/property/${property.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 hover:underline"
                    >
                        {property.name}
                    </a>
                    <div className="flex items-center gap-1 mt-1 text-gray-500">
                        <MapPin className="w-4 h-4"/>
                        <span className="text-sm">{property.location}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{property.price}</div>
                    <div className="text-sm text-gray-500">per night</div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Bed className="w-4 h-4"/>
                    <span>{property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Bath className="w-4 h-4"/>
                    <span>{property.bathrooms} bath{property.bathrooms > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4"/>
                    <span>{property.maxGuests} guests</span>
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current"/>
                        <span className="text-sm font-medium">{property.averageRating.toFixed(1)}</span>
                        <span className="text-sm text-gray-500">({property.totalReviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {property.recentTrend === 'up' && <TrendingUp className="w-4 h-4 text-green-500"/>}
                        {property.recentTrend === 'down' && <TrendingDown className="w-4 h-4 text-red-500"/>}
                        <span className="text-sm text-gray-500">
                            {property.approvalRate.toFixed(0)}% approved
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <a
                        href={`/property/${property.id}`}
                        className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                    >
                        View Page
                    </a>
                    <a
                        href={`/dashboard?property=${property.id}`}
                        className="px-3 py-1 text-sm bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100"
                    >
                        Manage
                    </a>
                </div>
            </div>
        </div>
    </div>
));

PropertyCard.displayName = 'PropertyCard';

export default function PropertiesPage() {
    const {properties, summaryStats, isLoading, error} = useProperties();

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load properties</h2>
                    <p className="text-gray-600 mb-4">{error.message}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Show loading state with skeleton
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <header className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-8">
                                <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
                                <nav className="hidden md:flex gap-6">
                                    <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
                                    <a href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</a>
                                </nav>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
                            <nav className="hidden md:flex gap-6">
                                <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
                                <a href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</a>
                            </nav>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Portfolio Overview</h2>
                    <p className="text-gray-600">Manage and monitor all your Flex Living properties</p>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <h3 className="text-sm font-medium text-gray-500">Total Properties</h3>
                        <p className="text-2xl font-bold text-gray-900">{summaryStats.totalProperties}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <h3 className="text-sm font-medium text-gray-500">Total Reviews</h3>
                        <p className="text-2xl font-bold text-gray-900">{summaryStats.totalReviews}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <h3 className="text-sm font-medium text-gray-500">Average Rating</h3>
                        <p className="text-2xl font-bold text-gray-900">{summaryStats.averageRating.toFixed(1)}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <h3 className="text-sm font-medium text-gray-500">Approved Reviews</h3>
                        <p className="text-2xl font-bold text-gray-900">{summaryStats.totalApproved}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {properties.map((property) => (
                        <PropertyCard key={property.id} property={property}/>
                    ))}
                </div>
            </main>
        </div>
    );
}