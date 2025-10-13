/**
 * Spare change proposals endpoint
 * GET /api/proposals - Generate spare change proposals for a wallet's transactions
 * POST /api/proposals - Generate and optionally save proposals
 */

import { NextRequest, NextResponse } from 'next/server';
import { TransactionFetcher } from '@/lib/services/transaction-fetcher';
import { ProposalEngine, ProposalConfig } from '@/lib/services/proposal-engine';
import { WalletFactory } from '@/lib/wallet/interface';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const lookbackDays = searchParams.get('lookbackDays');
    const roundupEnabled = searchParams.get('roundupEnabled') !== 'false';
    const percentageEnabled = searchParams.get('percentageEnabled') === 'true';
    const percentageRate = searchParams.get('percentageRate');

    // Validate required parameters
    if (!address) {
      return NextResponse.json(
        { error: 'Missing required parameter: address' },
        { status: 400 }
      );
    }

    // Create wallet provider from typed address
    const walletProvider = WalletFactory.createTypedAddress(address);

    // Initialize services
    const transactionFetcher = new TransactionFetcher();
    const proposalEngine = new ProposalEngine();

    // Fetch transactions
    const transactions = await transactionFetcher.fetchTransactions(walletProvider, {
      lookbackDays: lookbackDays ? parseInt(lookbackDays, 10) : undefined,
    });

    // Configure proposal generation
    const proposalConfig: ProposalConfig = {
      roundupEnabled,
      percentageEnabled,
      percentageRate: percentageRate ? parseFloat(percentageRate) : config.getConfig().defaultPercentageRate,
      minProposalAmount: 0.001, // Minimum 0.001 SOL
      maxProposalAmount: 1.0, // Maximum 1.0 SOL per proposal
    };

    // Generate proposals
    const result = await proposalEngine.generateProposals(
      transactions,
      address,
      proposalConfig
    );

    return NextResponse.json({
      success: true,
      data: {
        address,
        config: proposalConfig,
        proposals: result.proposals,
        summary: {
          totalProposals: result.proposals.length,
          totalSpareChangeSol: result.totalSpareChange,
          totalSpareChangeUsd: result.totalSpareChangeUsd,
          roundupProposals: result.proposals.filter(p => p.proposalType === 'roundup').length,
          percentageProposals: result.proposals.filter(p => p.proposalType === 'percentage').length,
        },
      },
    });
  } catch (error) {
    console.error('Error generating proposals:', error);

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
    const {
      address,
      lookbackDays,
      roundupEnabled = true,
      percentageEnabled = false,
      percentageRate,
      minProposalAmount,
      maxProposalAmount,
      saveToDatabase = false,
    } = body;

    // Validate required parameters
    if (!address) {
      return NextResponse.json(
        { error: 'Missing required parameter: address' },
        { status: 400 }
      );
    }

    // Create wallet provider from typed address
    const walletProvider = WalletFactory.createTypedAddress(address);

    // Initialize services
    const transactionFetcher = new TransactionFetcher();
    const proposalEngine = new ProposalEngine();

    // Fetch transactions
    const transactions = await transactionFetcher.fetchTransactions(walletProvider, {
      lookbackDays,
    });

    // Configure proposal generation
    const proposalConfig: ProposalConfig = {
      roundupEnabled,
      percentageEnabled,
      percentageRate: percentageRate || config.getConfig().defaultPercentageRate,
      minProposalAmount: minProposalAmount || 0.001,
      maxProposalAmount: maxProposalAmount || 1.0,
    };

    // Generate proposals
    const result = await proposalEngine.generateProposals(
      transactions,
      address,
      proposalConfig
    );

    // TODO: If saveToDatabase is true, save proposals to database
    // This would require implementing a database service first
    if (saveToDatabase) {
      console.warn('Database saving not yet implemented. Proposals generated but not saved.');
    }

    return NextResponse.json({
      success: true,
      data: {
        address,
        config: proposalConfig,
        proposals: result.proposals,
        summary: {
          totalProposals: result.proposals.length,
          totalSpareChangeSol: result.totalSpareChange,
          totalSpareChangeUsd: result.totalSpareChangeUsd,
          roundupProposals: result.proposals.filter(p => p.proposalType === 'roundup').length,
          percentageProposals: result.proposals.filter(p => p.proposalType === 'percentage').length,
          saved: saveToDatabase,
        },
      },
    });
  } catch (error) {
    console.error('Error generating proposals:', error);

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
