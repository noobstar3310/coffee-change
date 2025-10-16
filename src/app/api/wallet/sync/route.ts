import { NextRequest, NextResponse } from 'next/server';
import { TransactionTrackingService } from '@/lib/services/transaction-tracking-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Missing walletAddress' },
        { status: 400 }
      );
    }

    const trackingService = new TransactionTrackingService();
    const result = await trackingService.syncTransactions(walletAddress);

    // Get updated user status
    const status = await trackingService.getWalletStatus(walletAddress);

    let message = '';
    if (result.newTransactionCount === 0) {
      message = 'No new transactions found.';
    } else if (result.payoutTriggered) {
      const totalPayout = result.batchesCreated.reduce(
        (sum, batch) => sum + batch.total_spare_change_usd,
        0
      );
      message = `Processed ${result.newTransactionCount} new transaction(s). Payout batch created for $${totalPayout.toFixed(2)}!`;
    } else {
      message = `Processed ${result.newTransactionCount} new transaction(s).`;
    }

    return NextResponse.json({
      success: true,
      data: {
        newTransactionCount: result.newTransactionCount,
        newTransactions: result.newTransactions,
        payoutTriggered: result.payoutTriggered,
        batchesCreated: result.batchesCreated,
        user: status.summary,
        message,
      },
    });
  } catch (error) {
    console.error('Error syncing transactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync transactions',
      },
      { status: 500 }
    );
  }
}
