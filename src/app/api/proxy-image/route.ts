import { NextRequest, NextResponse } from 'next/server';
import { getMatchingImages } from '@/lib/gcs-info';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const bookId = searchParams.get('bookId');
    const page = searchParams.get('page');
    const index = parseInt(searchParams.get('index') || '0', 10);

    if (!bookId || !page) {
        return new NextResponse('Missing bookId or page', { status: 400 });
    }

    try {
        const pageNum = parseInt(page, 10);
        if (isNaN(pageNum)) {
            return new NextResponse('Invalid page number', { status: 400 });
        }

        // Fetch Signed URLs (using our robust cached credentials)
        const imageUrls = await getMatchingImages(bookId, pageNum);

        if (imageUrls.length === 0 || !imageUrls[index]) {
            // Return a placeholder or 404
            return new NextResponse('Image not found', { status: 404 });
        }

        // Redirect to the actual GCS Signed URL
        const targetUrl = imageUrls[index];
        return NextResponse.redirect(targetUrl);

    } catch (error) {
        console.error('Image Proxy Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
