import {revalidateTag} from 'next/cache';
import {NextRequest, NextResponse} from 'next/server';
import {routing} from '@/i18n/routing';

// Supported base cache tags that can be revalidated.
// These are the tag names WITHOUT locale suffixes.
const VALID_BASE_TAGS = [
    'collections',
    'countries',
    'featured',
] as const;

// Dynamic tags follow patterns like 'product-{slug}', 'collection-{slug}', 'related-products-{slug}'
const DYNAMIC_TAG_PATTERNS = [
    /^product-.+$/,
    /^collection-.+$/,
    /^collection-meta-.+$/,
    /^related-products-.+$/,
    /^navbar-collections$/,
    /^mobile-nav$/,
    /^footer$/,
];

function isValidBaseTag(tag: string): boolean {
    if ((VALID_BASE_TAGS as readonly string[]).includes(tag)) return true;
    return DYNAMIC_TAG_PATTERNS.some(pattern => pattern.test(tag));
}

export async function POST(request: NextRequest) {
    // Verify the secret token
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.REVALIDATION_SECRET;

    if (!expectedToken) {
        console.error('REVALIDATION_SECRET environment variable not set');
        return NextResponse.json(
            {error: 'Server configuration error'},
            {status: 500}
        );
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json(
            {error: 'Unauthorized'},
            {status: 401}
        );
    }

    try {
        const body = await request.json();
        const {tags} = body;

        if (!tags || !Array.isArray(tags) || tags.length === 0) {
            return NextResponse.json(
                {error: 'Missing or invalid "tags" array in request body'},
                {status: 400}
            );
        }

        // Validate and revalidate each tag for all locales
        const results: {tag: string; success: boolean; error?: string}[] = [];

        for (const tag of tags) {
            if (typeof tag !== 'string') {
                results.push({tag: String(tag), success: false, error: 'Invalid tag type'});
                continue;
            }

            if (!isValidBaseTag(tag)) {
                results.push({tag, success: false, error: 'Unknown tag'});
                continue;
            }

            // Revalidate for every locale
            for (const locale of routing.locales) {
                const localizedTag = `${tag}-${locale}`;
                try {
                    revalidateTag(localizedTag, {expire: 0});
                    results.push({tag: localizedTag, success: true});
                } catch {
                    results.push({tag: localizedTag, success: false, error: 'Revalidation failed'});
                }
            }
        }

        const allSuccessful = results.every(r => r.success);

        return NextResponse.json(
            {
                revalidated: allSuccessful,
                results,
                timestamp: Date.now(),
            },
            {status: allSuccessful ? 200 : 207} // 207 = Multi-Status
        );
    } catch {
        return NextResponse.json(
            {error: 'Invalid JSON body'},
            {status: 400}
        );
    }
}
