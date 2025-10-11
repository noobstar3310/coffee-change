import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock price data - in production, this would fetch from a real price oracle
    const mockPrices = {
      sol: {
        usd: 180.50,
        timestamp: new Date().toISOString()
      },
      usdc: {
        usd: 1.00,
        timestamp: new Date().toISOString()
      },
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(mockPrices);
  } catch (error) {
    console.error('Price fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}

