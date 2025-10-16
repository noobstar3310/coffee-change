import { NextRequest, NextResponse } from 'next/server';
import { TransactionTrackingService } from '@/lib/services/transaction-tracking-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Missing address parameter' },
        { status: 400 }
      );
    }

    const trackingService = new TransactionTrackingService();
    const status = await trackingService.getWalletStatus(address);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting wallet status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get wallet status',
      },
      { status: 500 }
    );
  }
}
