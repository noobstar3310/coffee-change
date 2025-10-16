import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user-service';

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

    const userService = new UserService();
    const result = await userService.connectWallet(walletAddress);

    return NextResponse.json({
      success: true,
      data: {
        user: result.user,
        isFirstTime: result.isFirstTime,
        lastTransaction: result.lastTransaction,
        message: result.isFirstTime
          ? 'Welcome! Your wallet has been connected and tracking has started.'
          : 'Welcome back! Your wallet is connected.',
      },
    });
  } catch (error) {
    console.error('Error connecting wallet:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      },
      { status: 500 }
    );
  }
}
