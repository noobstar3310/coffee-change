/**
 * Transaction fetching endpoint
 * GET /api/txns - Fetch transactions for a wallet address
 */

import { NextRequest, NextResponse } from 'next/server';
import { TransactionFetcher } from '@/lib/services/transaction-fetcher';
import { WalletFactory } from '@/lib/wallet/interface';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const lookbackDays = searchParams.get('lookbackDays');
    const limit = searchParams.get('limit');

    // Validate required parameters
    if (!address) {
      return NextResponse.json(
        { error: 'Missing required parameter: address' },
        { status: 400 }
      );
    }

    // Create wallet provider from typed address
    const walletProvider = WalletFactory.createTypedAddress(address);

    // Initialize transaction fetcher
    const fetcher = new TransactionFetcher();

    // Fetch transactions
    const transactions = await fetcher.fetchTransactions(walletProvider, {
      lookbackDays: lookbackDays ? parseInt(lookbackDays, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    // Calculate summary statistics
    const sentCount = transactions.filter(tx => tx.type === 'sent').length;
    const receivedCount = transactions.filter(tx => tx.type === 'received').length;
    const totalAmount = transactions
      .filter(tx => tx.type === 'sent' && tx.amount)
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        address,
        transactions,
        summary: {
          total: transactions.length,
          sent: sentCount,
          received: receivedCount,
          totalSent: totalAmount,
          lookbackDays: lookbackDays ? parseInt(lookbackDays, 10) : 30,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('Invalid Solana address') ? 400 : 500;

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, lookbackDays, limit } = body;

    // Validate required parameters
    if (!address) {
      return NextResponse.json(
        { error: 'Missing required parameter: address' },
        { status: 400 }
      );
    }

    // Create wallet provider from typed address
    const walletProvider = WalletFactory.createTypedAddress(address);

    // Initialize transaction fetcher
    const fetcher = new TransactionFetcher();

    // Fetch transactions
    const transactions = await fetcher.fetchTransactions(walletProvider, {
      lookbackDays,
      limit,
    });

    // Calculate summary statistics
    const sentCount = transactions.filter(tx => tx.type === 'sent').length;
    const receivedCount = transactions.filter(tx => tx.type === 'received').length;
    const totalAmount = transactions
      .filter(tx => tx.type === 'sent' && tx.amount)
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        address,
        transactions,
        summary: {
          total: transactions.length,
          sent: sentCount,
          received: receivedCount,
          totalSent: totalAmount,
          lookbackDays: lookbackDays || 30,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('Invalid Solana address') ? 400 : 500;

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode }
    );
  }
}
