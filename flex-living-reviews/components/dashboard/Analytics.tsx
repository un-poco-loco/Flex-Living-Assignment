// components/dashboard/Analytics.tsx
import {PropertyStats} from '@/lib/types/review';
import {ChevronDown, ChevronUp, Home, MessageSquare, Star, TrendingDown, TrendingUp} from 'lucide-react';
import {memo, useState} from 'react';

const SimpleChart = ({data, title, type = "line"}: { data: any[], title: string, type?: "line" | "bar" | "pie" }) => {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center min-h-0">
                <div className="text-center">
                    <div className="text-gray-500 text-sm">{title}</div>
                    <div className="text-gray-400 text-xs mt-2">No data available</div>
                </div>
            </div>
        );
    }

    if (type === "pie") {
        const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
        return (
            <div className="w-full h-full p-4 flex flex-col">
                <div className="text-center mb-4 text-gray-700 font-medium">{title}</div>
                <div className="space-y-3 flex-1 overflow-auto">
                    {data.map((item, index) => {
                        const percentage = total > 0 ? Math.round((Number(item.value) / total) * 100) : 0;
                        return (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div
                                        className="w-4 h-4 rounded-full mr-3"
                                        style={{backgroundColor: item.color || '#3b82f6'}}
                                    ></div>
                                    <span className="text-sm text-gray-700">{item.name}</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                                        <div
                                            className="h-2 rounded-full"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor: item.color || '#3b82f6'
                                            }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 w-8">{percentage}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (type === "bar") {
        const maxValue = 5;
        const getBarColor = (value: number) => {
            if (value >= 4.5) return "#16a34a";
            if (value >= 4.0) return "#fbbf24";
            return "#ef4444";
        };

        return (
            <div className="w-full p-4 h-full flex flex-col">
                <div className="text-center mb-4 text-gray-700 font-medium">{title}</div>
                {/* Bars */}
                <div className="flex items-end justify-around h-[85%] min-h-0">
                    {data.map((item, index) => {
                        const rating = Number(item.rating || item.value || 0);
                        const barHeightPercent = Math.max((rating / maxValue) * 100, 20);
                        return (
                            <div key={index} className="flex flex-col items-center w-12 h-full">
                                <div
                                    className="w-8 flex items-end justify-center rounded-full transition-all duration-300 hover:scale-105 relative"
                                    style={{
                                        height: `${barHeightPercent}%`,
                                        background: `linear-gradient(180deg, ${getBarColor(rating)} 60%, #e0e7ff 100%)`
                                    }}
                                >
                                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-white drop-shadow">
                                    {rating.toFixed(1)}
                                </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {/* Footer labels */}
                <div className="flex justify-around items-center mt-2 h-[15%]">
                    {data.map((item, index) => (
                        <span key={index} className="text text-gray-700 text-center w-12">
                        {item.category || item.name}
                    </span>
                    ))}
                </div>
            </div>
        );
    }

    // Simple line chart representation (default)
    return (
        <div className="w-full h-full p-4 flex flex-col">
            <div className="text-center mb-4 text-gray-700 font-medium">{title}</div>
            <div className="h-full flex items-end justify-center space-x-1 min-h-0">
                {data.slice(0, 10).map((item, index) => {
                    const value = Number(item.rating || item.count || item.value || 0);
                    const height = Math.max(value * 20, 8);
                    return (
                        <div key={index} className="flex flex-col items-center">
                            <div
                                className="bg-blue-500 rounded-full w-2"
                                style={{ height: `${height}px` }}
                            ></div>
                            <span className="text-xs text-gray-600 mt-1">
                                {item.date ? new Date(item.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : index + 1}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="text-center text-xs text-gray-500 mt-2">
                {data.length} data points
            </div>
        </div>
    );
};

interface AnalyticsProps {
    stats: PropertyStats;
}

const Analytics = memo(function Analytics({stats}: AnalyticsProps) {
    const COLORS = {
        positive: '#10b981',
        neutral: '#f59e0b',
        negative: '#ef4444'
    };

    const sentimentData = Object.entries(stats.sentimentBreakdown).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value,
        color: COLORS[key as keyof typeof COLORS]
    }));

    const categoryData = Object.entries(stats.categoryAverages).map(([category, rating]) => ({
        category: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        rating: Number(rating)
    }));

    const trend = stats.trendData.length > 1
        ? stats.trendData[stats.trendData.length - 1].rating - stats.trendData[0].rating
        : 0;

    return (
        <div className="flex flex-col h-full min-h-0 space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-32">
                <MetricCard
                    title="Total Reviews"
                    value={stats.totalReviews.toString()}
                    icon={<MessageSquare className="w-5 h-5"/>}
                    change={null}
                />
                <MetricCard
                    title="Average Rating"
                    value={stats.averageRating.toFixed(2)}
                    icon={<Star className="w-5 h-5"/>}
                    change={trend}
                />
                <MetricCard
                    title="Response Rate"
                    value="94%"
                    icon={<TrendingUp className="w-5 h-5"/>}
                    change={5}
                />
                <MetricCard
                    title="Properties"
                    value="12"
                    icon={<Home className="w-5 h-5"/>}
                    change={null}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px] min-h-0">
            {/* Rating Trend */}
                <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col min-h-0">
                    <h3 className="text-lg font-semibold mb-4">Rating Trend</h3>
                    <SimpleChart data={stats.trendData} title=""/>
                </div>

                {/* Sentiment Distribution */}
                <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col min-h-0">
                    <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
                    <SimpleChart data={sentimentData} title="" type="pie"/>
                </div>

                {/* Category Performance */}
                <div className="bg-white rounded-lg shadow p-6 lg:col-span-2 h-full flex flex-col min-h-0">
                    <h3 className="text-lg font-semibold mb-4">Category Performance</h3>
                    <SimpleChart data={categoryData} title="" type="bar"/>
                </div>
            </div>

            {/* Property Performance Comparison */}
            <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col min-h-0">
                <h3 className="text-lg font-semibold mb-4">Property Performance Overview</h3>
                <PropertyPerformanceTable/>
            </div>
        </div>
    );
});

function PropertyPerformanceTable() {
    const [expandedProperty, setExpandedProperty] = useState<string | null>(null);

    const propertyPerformance = [
        {
            id: '2B-N1-A',
            name: '2B N1 A - Shoreditch Heights',
            rating: 4.8,
            reviews: 45,
            approval: 89,
            details: {
                type: 'Entire apartment',
                location: 'Shoreditch, London',
                price: '£150/night',
                bedrooms: 2,
                bathrooms: 1,
                maxGuests: 4,
                recentTrend: '+0.3',
                topIssues: ['Minor bathroom updates needed', 'Noise from street'],
                topStrengths: ['Excellent location', 'Responsive host', 'Clean and modern']
            }
        },
        {
            id: '2B-N1-B',
            name: '2B N1 B - Shoreditch Heights',
            rating: 4.6,
            reviews: 32,
            approval: 78,
            details: {
                type: 'Entire apartment',
                location: 'Shoreditch, London',
                price: '£145/night',
                bedrooms: 2,
                bathrooms: 1,
                maxGuests: 4,
                recentTrend: '-0.2',
                topIssues: ['Heating issues', 'Maintenance needed'],
                topStrengths: ['Great area restaurants', 'Good communication', 'Comfortable space']
            }
        },
        {
            id: '3B-S2-A',
            name: '3B S2 A - Southbank Residences',
            rating: 4.9,
            reviews: 28,
            approval: 95,
            details: {
                type: 'Entire apartment',
                location: 'Southbank, London',
                price: '£220/night',
                bedrooms: 3,
                bathrooms: 2,
                maxGuests: 6,
                recentTrend: '+0.1',
                topIssues: ['Occasional shower pressure'],
                topStrengths: ['Stunning Thames views', 'Spacious layout', 'Premium location']
            }
        },
        {
            id: '1B-E3-C',
            name: '1B E3 C - East Village',
            rating: 4.4,
            reviews: 22,
            approval: 72,
            details: {
                type: 'Entire apartment',
                location: 'East Village, London',
                price: '£110/night',
                bedrooms: 1,
                bathrooms: 1,
                maxGuests: 2,
                recentTrend: '+0.2',
                topIssues: ['WiFi intermittent', 'Space feels cramped'],
                topStrengths: ['Great value', 'Good transport links', 'Quiet area']
            }
        }
    ];

    const toggleExpanded = (propertyId: string) => {
        setExpandedProperty(expandedProperty === propertyId ? null : propertyId);
    };

    return (
        <div className="space-y-4">
            {propertyPerformance.map((property) => (
                <div key={property.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Header Row */}
                    <div className="bg-gray-50 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-8">
                                <div>
                                    <a
                                        href={`/property/${property.id}`}
                                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                    >
                                        {property.name}
                                    </a>
                                </div>
                                <div className="flex items-center">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1"/>
                                    <span className="text-sm font-medium">{property.rating}</span>
                                    <span className="text-sm text-gray-500 ml-1">({property.reviews} reviews)</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                        <div
                                            className="bg-green-600 h-2 rounded-full"
                                            style={{width: `${property.approval}%`}}
                                        ></div>
                                    </div>
                                    <span className="text-sm text-gray-900">{property.approval}% approved</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                {/*<a*/}
                                {/*    href={`?property=${property.id}`}*/}
                                {/*    className="text-blue-600 hover:text-blue-900 hover:underline text-sm"*/}
                                {/*>*/}
                                {/*    Manage Reviews*/}
                                {/*</a>*/}
                                <button
                                    onClick={() => toggleExpanded(property.id)}
                                    className="flex items-center text-blue-600 hover:text-blue-900 text-sm"
                                >
                                    View Details
                                    {expandedProperty === property.id ?
                                        <ChevronUp className="w-4 h-4 ml-1"/> :
                                        <ChevronDown className="w-4 h-4 ml-1"/>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Accordion Content */}
                    {expandedProperty === property.id && (
                        <div className="px-6 py-4 bg-white border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Property Details</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Type:</span>
                                            <span className="text-gray-900">{property.details.type}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Location:</span>
                                            <span className="text-gray-900">{property.details.location}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Price:</span>
                                            <span className="text-gray-900">{property.details.price}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Capacity:</span>
                                            <span
                                                className="text-gray-900">{property.details.bedrooms} bed, {property.details.bathrooms} bath, {property.details.maxGuests} guests</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Recent Trend:</span>
                                            <span
                                                className={`font-medium ${property.details.recentTrend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                                {property.details.recentTrend}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Performance Insights</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <h5 className="text-sm font-medium text-gray-700 mb-1">Top Strengths</h5>
                                            <ul className="text-sm text-green-600 space-y-1">
                                                {property.details.topStrengths.map((strength, idx) => (
                                                    <li key={idx}>• {strength}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-medium text-gray-700 mb-1">Areas for
                                                Improvement</h5>
                                            <ul className="text-sm text-amber-600 space-y-1">
                                                {property.details.topIssues.map((issue, idx) => (
                                                    <li key={idx}>• {issue}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function MetricCard({
                        title,
                        value,
                        icon,
                        change
                    }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    change: number | null;
}) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">{title}</h3>
                <div className="text-gray-400">{icon}</div>
            </div>
            <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{value}</p>
                {change !== null && (
                    <span className={`ml-2 text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change > 0 ? <TrendingUp className="inline w-4 h-4"/> :
                            <TrendingDown className="inline w-4 h-4"/>}
                        {Math.abs(change).toFixed(1)}%
                    </span>
                )}
            </div>
        </div>
    );
}

export default Analytics;
