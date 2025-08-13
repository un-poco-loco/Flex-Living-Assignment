// components/dashboard/FilterPanel.tsx
import {useState} from 'react';
import {Filter, X} from 'lucide-react';

interface FilterPanelProps {
    onFiltersChange: (filters: any) => void;
}

export default function FilterPanel({onFiltersChange}: FilterPanelProps) {
    const [filters, setFilters] = useState({
        channel: '',
        minRating: '',
        dateRange: '',
        listingId: '',
        sentiment: ''
    });

    const [isExpanded, setIsExpanded] = useState(false);

    const channels = ['airbnb', 'booking', 'vrbo', 'google', 'direct'];
    const properties = [
        '2B-N1-A',
        '2B-N1-B',
        '3B-S2-A',
        '1B-E3-C'
    ];

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = {...filters, [key]: value};
        setFilters(newFilters);

        // Remove empty values before sending
        const activeFilters = Object.entries(newFilters)
            .filter(([_, v]) => v !== '')
            .reduce((acc, [k, v]) => ({...acc, [k]: v}), {});

        onFiltersChange(activeFilters);
    };

    const clearFilters = () => {
        setFilters({
            channel: '',
            minRating: '',
            dateRange: '',
            listingId: '',
            sentiment: ''
        });
        onFiltersChange({});
    };

    const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                >
                    <Filter className="w-5 h-5"/>
                    <span className="font-medium">Filters</span>
                    {activeFilterCount > 0 && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
              {activeFilterCount}
            </span>
                    )}
                </button>
                {activeFilterCount > 0 && (
                    <button
                        onClick={clearFilters}
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                        <X className="w-4 h-4"/>
                        Clear all
                    </button>
                )}
            </div>

            {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Property
                        </label>
                        <select
                            value={filters.listingId}
                            onChange={(e) => handleFilterChange('listingId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Properties</option>
                            {properties.map((prop) => (
                                <option key={prop} value={prop}>{prop}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Channel
                        </label>
                        <select
                            value={filters.channel}
                            onChange={(e) => handleFilterChange('channel', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Channels</option>
                            {channels.map((channel) => (
                                <option key={channel} value={channel}>
                                    {channel.charAt(0).toUpperCase() + channel.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Min Rating
                        </label>
                        <select
                            value={filters.minRating}
                            onChange={(e) => handleFilterChange('minRating', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Any Rating</option>
                            <option value="4.5">4.5+ Stars</option>
                            <option value="4">4+ Stars</option>
                            <option value="3">3+ Stars</option>
                            <option value="2">2+ Stars</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sentiment
                        </label>
                        <select
                            value={filters.sentiment}
                            onChange={(e) => handleFilterChange('sentiment', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All</option>
                            <option value="positive">Positive</option>
                            <option value="neutral">Neutral</option>
                            <option value="negative">Negative</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date Range
                        </label>
                        <select
                            value={filters.dateRange}
                            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Time</option>
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="365">Last year</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
}