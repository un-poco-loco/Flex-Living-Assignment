// app/page.tsx
import Link from 'next/link';
import { BarChart3, Home, Star } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Flex Living Reviews Platform
                    </h1>
                    <p className="text-xl text-gray-600">
                        Manage guest reviews and optimize property performance
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <Link
                        href="/dashboard"
                        className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
                    >
                        <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4">
                            <BarChart3 className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">Manager Dashboard</h2>
                        <p className="text-gray-600">
                            Access analytics, manage reviews, and control what guests see on your properties
                        </p>
                    </Link>

                    <Link
                        href="/properties"
                        className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
                    >
                        <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-lg mb-4">
                            <Home className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">Properties Overview</h2>
                        <p className="text-gray-600">
                            Browse all properties, view performance metrics, and access individual property pages
                        </p>
                    </Link>
                </div>

                <div className="mt-12 text-center">
                    <div className="inline-flex items-center gap-2 text-gray-500">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span>Powered by real guest feedback</span>
                    </div>
                </div>
            </div>
        </div>
    );
}