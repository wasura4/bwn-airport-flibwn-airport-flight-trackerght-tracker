import { NextRequest, NextResponse } from 'next/server';
import { getDepartures } from '@/lib/flightaware';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const airport = searchParams.get('airport') || 'BWN';

  if (!date) {
    return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
  }

  try {
    const flights = await getDepartures(airport, date);
    
    // Cache the response for 15 minutes
    const response = NextResponse.json({ flights });
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=900, stale-while-revalidate=3600'
    );
    
    return response;
  } catch (error) {
    console.error('Error in departures API:', error);
    return NextResponse.json({ error: 'Failed to fetch departures' }, { status: 500 });
  }
}
