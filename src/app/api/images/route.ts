import { NextRequest, NextResponse } from 'next/server';
import { getMatchingImages } from '@/lib/gcs-info';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const bookId = searchParams.get('bookId'); // e.g., "15"
    const page = searchParams.get('page');     // e.g., "10"

    if (!bookId || !page) {
        return NextResponse.json({ error: 'Missing bookId or page parameter' }, { status: 400 });
    }

    try {
        const pageNum = parseInt(page, 10);
        if (isNaN(pageNum)) {
            return NextResponse.json({ error: 'Invalid page number' }, { status: 400 });
        }

        const imageUrls = await getMatchingImages(bookId, pageNum);

        return NextResponse.json({
            images: imageUrls,
            count: imageUrls.length
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
