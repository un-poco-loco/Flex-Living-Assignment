// app/property/[id]/page.tsx
'use client';

import {useMemo} from 'react';
import ReviewsSection from '@/components/property/ReviewsSection';
import {Bath, Bed, Car, Home, MapPin, Star, Users, Wifi} from 'lucide-react';
import { usePropertyReviews } from '@/lib/hooks/useReviews';

export default function PropertyPage({params}: { params: { id: string } }) {
    // Use optimized SWR hook for property reviews
    const { reviews, isLoading: loading, error } = usePropertyReviews(params.id, {
        // Cache longer for property pages since they change less frequently
        dedupingInterval: 15 * 60 * 1000, // 15 minutes
        refreshInterval: 30 * 60 * 1000,  // 30 minutes background refresh
    });

    // Mock property data - in real app would fetch from API
    const getPropertyData = (id: string) => {
        const properties = {
            '2B-N1-A': {
                id: '2B-N1-A',
                name: '2B N1 A - 29 Shoreditch Heights',
                type: 'Entire apartment',
                location: 'Shoreditch, London',
                price: '£150',
                bedrooms: 2,
                bathrooms: 1,
                maxGuests: 4,
                description: `Experience the vibrant heart of East London in this stylish 2-bedroom apartment in Shoreditch Heights. 
Perfect for both business and leisure travelers, this modern space offers stunning city views and is just minutes 
from the best restaurants, bars, and cultural attractions Shoreditch has to offer.`
            },
            '2B-N1-B': {
                id: '2B-N1-B',
                name: '2B N1 B - 29 Shoreditch Heights',
                type: 'Entire apartment',
                location: 'Shoreditch, London',
                price: '£145',
                bedrooms: 2,
                bathrooms: 1,
                maxGuests: 4,
                description: `Another beautiful 2-bedroom apartment in the iconic Shoreditch Heights building. 
This modern unit offers comfort and style in one of London's most exciting neighborhoods, with easy access to 
trendy restaurants, nightlife, and excellent transport links.`
            },
            '3B-S2-A': {
                id: '3B-S2-A',
                name: '3B S2 A - 15 Southbank Residences',
                type: 'Entire apartment',
                location: 'Southbank, London',
                price: '£220',
                bedrooms: 3,
                bathrooms: 2,
                maxGuests: 6,
                description: `Stunning 3-bedroom apartment with breathtaking Thames views in the prestigious Southbank area. 
This spacious modern residence is perfectly located near the London Eye, Tate Modern, and Borough Market, 
offering the ultimate London experience with luxury accommodations.`
            },
            '1B-E3-C': {
                id: '1B-E3-C',
                name: '1B E3 C - 42 East Village',
                type: 'Entire apartment',
                location: 'East Village, London',
                price: '£110',
                bedrooms: 1,
                bathrooms: 1,
                maxGuests: 2,
                description: `Cozy 1-bedroom apartment in the vibrant East Village area. Perfect for couples or solo travelers 
looking for a comfortable base to explore London. Close to Westfield Shopping Centre and excellent transport 
connections to central London.`
            }
        };

        return properties[id as keyof typeof properties] || properties['2B-N1-A'];
    };

    // Memoize property data and calculations for better performance
    const property = useMemo(() => {
        const propertyData = getPropertyData(params.id);
        const averageRating = reviews.length > 0
            ? Math.round(
                (reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / reviews.length) * 100
            ) / 100
            : 4.8;

        return {
            ...propertyData,
            rating: averageRating,
            reviewCount: reviews.length,
            images: [
                '/api/placeholder/800/600',
                '/api/placeholder/800/600',
                '/api/placeholder/800/600'
            ],
            amenities: [
                {icon: <Wifi className="w-5 h-5"/>, label: 'Wi-Fi'},
                {icon: <Car className="w-5 h-5"/>, label: 'Free parking'},
                {icon: <Users className="w-5 h-5"/>, label: `Up to ${propertyData.maxGuests} guests`},
                {icon: <Bed className="w-5 h-5"/>, label: `${propertyData.bedrooms} bedroom${propertyData.bedrooms > 1 ? 's' : ''}`},
                {icon: <Bath className="w-5 h-5"/>, label: `${propertyData.bathrooms} bathroom${propertyData.bathrooms > 1 ? 's' : ''}`},
                {icon: <Home className="w-5 h-5"/>, label: 'Entire place'}
            ]
        };
    }, [params.id, reviews]);

    // Handle error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load property data</h2>
                    <p className="text-gray-600 mb-4">Please try refreshing the page</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold">Flex Living</h1>
                            <nav className="hidden md:flex gap-6">
                                <a href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</a>
                                <a href="/properties" className="text-gray-600 hover:text-gray-900">Properties</a>
                            </nav>
                        </div>
                        <a href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Manage Reviews
                        </a>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Property Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.name}</h1>
                    <div className="flex items-center gap-4 text-gray-600">
                        <div className="flex items-center gap-1">
                            <Star className="w-5 h-5 text-yellow-400 fill-current"/>
                            <span className="font-semibold">{property.rating}</span>
                            <span>({property.reviewCount} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MapPin className="w-5 h-5"/>
                            <span>{property.location}</span>
                        </div>
                    </div>
                </div>

                {/* Image Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {property.images.map((image, idx) => (
                        <div key={idx} className="aspect-w-4 aspect-h-3">
                            <img
                                src={image}
                                alt={`Property image ${idx + 1}`}
                                className="w-full h-64 object-cover rounded-lg"
                            />
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description */}
                        <section className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">About this place</h2>
                            <p className="text-gray-700 leading-relaxed">{property.description}</p>
                        </section>

                        {/* Amenities */}
                        <section className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {property.amenities.map((amenity, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="text-gray-600">{amenity.icon}</div>
                                        <span className="text-gray-700">{amenity.label}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Reviews Section */}
                        <ReviewsSection reviews={reviews} loading={loading}/>
                    </div>

                    {/* Property Stats Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                            <div className="mb-4">
                                <span className="text-2xl font-bold">{property.price}</span>
                                <span className="text-gray-600"> / night</span>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Property Type</span>
                                    <span className="font-medium">{property.type}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Max Guests</span>
                                    <span className="font-medium">{property.maxGuests} guests</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Total Reviews</span>
                                    <span className="font-medium">{property.reviewCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Average Rating</span>
                                    <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                        <span className="font-medium">{property.rating.toFixed(1)}</span>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-100">
                                    <a href="/dashboard" 
                                       className="w-full block text-center py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                                        Manage Reviews
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}