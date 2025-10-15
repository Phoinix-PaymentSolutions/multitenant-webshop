// app/api/reviews/[placeId]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { placeId: string } }
) {
  const { placeId } = params;

  console.log('📍 Reviews API called with placeId:', placeId);

  if (!placeId) {
    console.error('❌ No placeId provided');
    return NextResponse.json({ error: 'Place ID required' }, { status: 400 });
  }

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.error('❌ GOOGLE_PLACES_API_KEY not configured');
    return NextResponse.json(
      { error: 'API key not configured', reviews: [], rating: 0, totalReviews: 0 },
      { status: 500 }
    );
  }

  try {
    console.log('🔑 Using API key:', process.env.GOOGLE_PLACES_API_KEY?.substring(0, 10) + '...');
    
    // Using Places API (New)
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    console.log('🌐 Fetching from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'reviews,rating,userRatingCount',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    console.log('📊 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google API error:', errorText);
      throw new Error(`Google API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Reviews data:', JSON.stringify(data, null, 2));

    return NextResponse.json({
      reviews: data.reviews || [],
      rating: data.rating || 0,
      totalReviews: data.userRatingCount || 0
    });

  } catch (error) {
    console.error('💥 Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews', reviews: [], rating: 0, totalReviews: 0 },
      { status: 500 }
    );
  }
}