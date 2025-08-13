// app/api/listings/hostaway/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

const HOSTAWAY_LISTINGS_URL = 'https://api.hostaway.com/v1/listings';
const HOSTAWAY_TOKEN_URL = 'https://api.hostaway.com/v1/accessTokens';
const CLIENT_ID = process.env.HOSTAWAY_ACCOUNT_ID;
const CLIENT_SECRET = process.env.HOSTAWAY_API_KEY;

// Cache for access token (in production, use Redis or similar)
let accessTokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
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
            body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&scope=general`
        });

        if (response.ok) {
            const data = await response.json();
            const expiresAt = Date.now() + (data.expires_in * 1000) - 60000; // Subtract 1 minute for safety
            
            accessTokenCache = {
                token: data.access_token,
                expiresAt
            };
            
            console.log('Successfully obtained Hostaway access token for listings');
            return data.access_token;
        }
    } catch (error) {
        console.error('Failed to get Hostaway access token:', error);
    }

    return null;
}

interface HostawayListing {
    id: number;
    name: string;
    internalListingName: string;
    description: string;
    city: string;
    address: string;
    price: number;
    personCapacity: number;
    bedroomsNumber: number;
    bathroomsNumber: number;
    lat: number;
    lng: number;
}

function normalizeListing(listing: HostawayListing) {
    return {
        id: String(listing.id),
        name: listing.name,
        internalName: listing.internalListingName,
        description: listing.description,
        location: `${listing.city}`,
        address: listing.address,
        price: listing.price,
        capacity: listing.personCapacity,
        bedrooms: listing.bedroomsNumber,
        bathrooms: listing.bathroomsNumber,
        coordinates: {
            lat: listing.lat,
            lng: listing.lng
        },
        type: 'Entire apartment' // Default for now
    };
}

export async function GET(request: NextRequest) {
    try {
        let listings = [];
        let dataSource = 'none';

        // Try to get access token and fetch from real API
        const accessToken = await getAccessToken();
        
        if (accessToken) {
            try {
                const headers = {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                };

                const response = await fetch(`${HOSTAWAY_LISTINGS_URL}?limit=100`, {
                    headers,
                    cache: 'no-store'
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.result && Array.isArray(data.result)) {
                        listings = data.result;
                        dataSource = 'api';
                        console.log(`Fetched ${listings.length} listings from Hostaway API`);
                    }
                }
            } catch (apiError) {
                console.log('Hostaway listings API fetch failed:', apiError);
            }
        } else {
            console.log('Failed to get access token for listings');
        }

        // Normalize all listings
        const normalizedListings = listings.map(normalizeListing);

        return NextResponse.json({
            status: 'success',
            result: normalizedListings,
            meta: {
                total: normalizedListings.length,
                source: dataSource
            }
        });

    } catch (error) {
        console.error('Error fetching listings:', error);
        return NextResponse.json(
            { status: 'error', message: 'Failed to fetch listings' },
            { status: 500 }
        );
    }
}