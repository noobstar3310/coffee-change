import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Mock pool position data
    const mockPosition = {
      wallet: walletAddress,
      totalValue: 1250.75,
      userShare: 0.15, // 15%
      userDeposits: 187.50,
      totalDeposits: 1250.75,
      poolSize: 1250.75,
      lastContribution: "12/15/2024",
      historicalContributions: 8,
      status: 'active'
    };

    return NextResponse.json(mockPosition);
  } catch (error) {
    console.error('Pool position fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pool position' },
      { status: 500 }
    );
  }
}
