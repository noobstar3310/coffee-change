import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock transaction scan data
    const mockData = {
      lastScannedTx: {
        hash: "3Kj8...9Xm2",
        timestamp: new Date().toISOString(),
        amount: 0.5,
        type: 'sent'
      },
      roundUpBalance: {
        totalUsd: 3.25,
        solEquivalent: 0.018,
        usdcEquivalent: 3.25
      },
      lastSync: new Date().toLocaleString(),
      status: 'success'
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Transaction scan error:', error);
    return NextResponse.json(
      { error: 'Failed to scan transactions' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Mock trigger scan endpoint
    const mockResponse = {
      message: 'Transaction scan initiated',
      scanId: Math.random().toString(36).substring(7),
      status: 'scanning'
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Scan trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger scan' },
      { status: 500 }
    );
  }
}

