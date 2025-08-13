// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable stable performance features only
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    // Optimize images
    images: {
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    // This is not usually needed as Next.js handles it automatically
    // but included for completeness
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            '@': __dirname,
        };
        
        // Optimize chunks for better performance
        config.optimization.splitChunks = {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    priority: 10,
                    chunks: 'all',
                },
                common: {
                    name: 'common',
                    minChunks: 2,
                    priority: 5,
                    reuseExistingChunk: true,
                },
            },
        };
        
        return config;
    },
};

module.exports = nextConfig;