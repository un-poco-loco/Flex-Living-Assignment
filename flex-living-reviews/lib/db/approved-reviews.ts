// lib/db/approved-reviews.ts
import fs from 'fs/promises';
import path from 'path';

const APPROVED_REVIEWS_FILE = path.join(process.cwd(), 'data', 'approved-reviews.json');

interface ApprovedReviewsData {
    approvedReviews: Set<string>;
}

// In-memory cache
let approvedReviewsCache: Set<string> | null = null;

async function ensureDataDir() {
    const dataDir = path.dirname(APPROVED_REVIEWS_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

async function loadApprovedReviews(): Promise<Set<string>> {
    if (approvedReviewsCache) {
        return approvedReviewsCache;
    }

    try {
        await ensureDataDir();
        const data = await fs.readFile(APPROVED_REVIEWS_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        approvedReviewsCache = new Set(parsed.approvedReviews || []);
    } catch (error) {
        // File doesn't exist or is corrupted, start with empty set
        approvedReviewsCache = new Set();
    }

    return approvedReviewsCache;
}

async function saveApprovedReviews(approvedReviews: Set<string>): Promise<void> {
    try {
        await ensureDataDir();
        const data = {
            approvedReviews: Array.from(approvedReviews),
            lastUpdated: new Date().toISOString()
        };
        await fs.writeFile(APPROVED_REVIEWS_FILE, JSON.stringify(data, null, 2));
        approvedReviewsCache = approvedReviews;
    } catch (error) {
        console.error('Failed to save approved reviews:', error);
    }
}

export async function isReviewApproved(reviewId: string): Promise<boolean> {
    const approvedReviews = await loadApprovedReviews();
    return approvedReviews.has(reviewId);
}

export async function approveReview(reviewId: string): Promise<number> {
    const approvedReviews = await loadApprovedReviews();
    approvedReviews.add(reviewId);
    await saveApprovedReviews(approvedReviews);
    return approvedReviews.size;
}

export async function disapproveReview(reviewId: string): Promise<number> {
    const approvedReviews = await loadApprovedReviews();
    approvedReviews.delete(reviewId);
    await saveApprovedReviews(approvedReviews);
    return approvedReviews.size;
}

export async function getApprovedReviewsCount(): Promise<number> {
    const approvedReviews = await loadApprovedReviews();
    return approvedReviews.size;
}

export async function getAllApprovedReviews(): Promise<Set<string>> {
    return await loadApprovedReviews();
}