import { NextResponse } from 'next/server';
import uploadToR2 from '@/lib/cloudflare-r2';

export const runtime = 'edge';

export async function POST(request) {
  try {
    console.log('Share image generation started');
    const { fid, trait, analysis } = await request.json();
    console.log('Request params:', { fid, trait, analysis });
    
    if (!fid) {
      console.log('Missing FID');
      return NextResponse.json(
        { error: 'FID is required' },
        { status: 400 }
      );
    }

    // Generate the OG image by calling our OG route
    const ogUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?fid=${fid}&analysis=${encodeURIComponent(JSON.stringify(analysis))}`;
    console.log('Fetching OG image from:', ogUrl);
    
    const ogResponse = await fetch(ogUrl, { 
      cache: 'no-store',
      method: 'GET'
    });
    console.log('OG response status:', ogResponse.status);
    
    if (!ogResponse.ok) {
      console.error('OG response not ok:', ogResponse.status, ogResponse.statusText);
      const error = await ogResponse.json();
      console.error('OG error details:', error);
      return NextResponse.json(
        { error: error.error || 'Failed to generate OG image' },
        { status: ogResponse.status }
      );
    }

    // Get the image buffer
    console.log('Getting image buffer...');
    const imageBuffer = await ogResponse.arrayBuffer();
    console.log('Image buffer size:', imageBuffer.byteLength);
    
    // Upload to R2
    const filename = `og-${fid}-${Date.now()}.png`;
    console.log('Uploading to R2:', filename);
    const imageUrl = await uploadToR2(imageBuffer, filename);
    console.log('Upload successful:', imageUrl);
    
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
} 