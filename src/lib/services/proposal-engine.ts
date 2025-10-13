/**
 * Spare change proposal engine
 * Generates round-up and percentage-based contribution proposals
 */

import { TransactionDetails } from './transaction-fetcher';
import { PriceOracle } from './price-oracle';
import { CreateContributionProposal } from '../db/types';

export interface ProposalConfig {
  roundupEnabled: boolean;
  percentageEnabled: boolean;
  percentageRate: number; // e.g., 1.0 for 1%
  minProposalAmount?: number; // Minimum amount in SOL to create a proposal
  maxProposalAmount?: number; // Maximum amount in SOL for a single proposal
}

export interface ProposalResult {
  proposals: CreateContributionProposal[];
  totalSpareChange: number;
  totalSpareChangeUsd: number;
}

export class ProposalEngine {
  private priceOracle: PriceOracle;

  constructor() {
    this.priceOracle = new PriceOracle();
  }

  /**
   * Generate proposals from transactions
   */
  async generateProposals(
    transactions: TransactionDetails[],
    walletAddress: string,
    config: ProposalConfig
  ): Promise<ProposalResult> {
    const proposals: CreateContributionProposal[] = [];
    let totalSpareChange = 0;
    let totalSpareChangeUsd = 0;

    // Only process 'sent' transactions (outgoing payments)
    const sentTransactions = transactions.filter(tx => tx.type === 'sent' && tx.success && tx.amount);

    for (const tx of sentTransactions) {
      if (!tx.amount) continue;

      // Generate round-up proposal
      if (config.roundupEnabled) {
        const roundupProposal = await this.generateRoundupProposal(tx, walletAddress, config);
        if (roundupProposal) {
          proposals.push(roundupProposal);
          totalSpareChange += roundupProposal.spareChangeAmountSol;
          totalSpareChangeUsd += roundupProposal.spareChangeAmountUsd || 0;
        }
      }

      // Generate percentage-based proposal
      if (config.percentageEnabled && config.percentageRate > 0) {
        const percentageProposal = await this.generatePercentageProposal(
          tx,
          walletAddress,
          config
        );
        if (percentageProposal) {
          proposals.push(percentageProposal);
          totalSpareChange += percentageProposal.spareChangeAmountSol;
          totalSpareChangeUsd += percentageProposal.spareChangeAmountUsd || 0;
        }
      }
    }

    return {
      proposals,
      totalSpareChange,
      totalSpareChangeUsd,
    };
  }

  /**
   * Generate a round-up proposal for a transaction
   * Rounds up to the nearest whole number (e.g., 0.5 SOL -> 1.0 SOL, spare = 0.5 SOL)
   */
  private async generateRoundupProposal(
    tx: TransactionDetails,
    walletAddress: string,
    config: ProposalConfig
  ): Promise<CreateContributionProposal | null> {
    if (!tx.amount) return null;

    const amount = tx.amount;
    const roundedUp = Math.ceil(amount);
    const spareChange = roundedUp - amount;

    // Skip if spare change is too small
    if (config.minProposalAmount && spareChange < config.minProposalAmount) {
      return null;
    }

    // Cap at max amount
    const finalSpareChange = config.maxProposalAmount
      ? Math.min(spareChange, config.maxProposalAmount)
      : spareChange;

    // Get price at block time
    const priceData = await this.priceOracle.getHistoricalPrice({
      tokenMint: tx.tokenMint,
      blockTime: tx.blockTime,
      slot: tx.slot,
    });

    // Calculate USD values
    const originalAmountUsd = amount * priceData.price;
    const spareChangeUsd = finalSpareChange * priceData.price;

    const proposal: CreateContributionProposal = {
      walletAddress,
      transactionSignature: tx.signature,
      transactionTimestamp: tx.timestamp,
      transactionSlot: tx.slot,
      originalAmountSol: amount,
      originalAmountUsd,
      tokenMint: tx.tokenMint,
      tokenSymbol: tx.tokenSymbol || (tx.tokenMint ? undefined : 'SOL'),
      solPriceUsd: tx.tokenMint ? undefined : priceData.price,
      tokenPriceUsd: tx.tokenMint ? priceData.price : undefined,
      priceSource: priceData.source === 'cached' ? 'jupiter' : priceData.source,
      proposalType: 'roundup',
      spareChangeAmountSol: finalSpareChange,
      spareChangeAmountUsd: spareChangeUsd,
      status: 'pending',
    };

    return proposal;
  }

  /**
   * Generate a percentage-based proposal for a transaction
   * Calculates a percentage of the transaction amount (e.g., 1% of 10 SOL = 0.1 SOL)
   */
  private async generatePercentageProposal(
    tx: TransactionDetails,
    walletAddress: string,
    config: ProposalConfig
  ): Promise<CreateContributionProposal | null> {
    if (!tx.amount || !config.percentageRate) return null;

    const amount = tx.amount;
    const spareChange = amount * (config.percentageRate / 100);

    // Skip if spare change is too small
    if (config.minProposalAmount && spareChange < config.minProposalAmount) {
      return null;
    }

    // Cap at max amount
    const finalSpareChange = config.maxProposalAmount
      ? Math.min(spareChange, config.maxProposalAmount)
      : spareChange;

    // Get price at block time
    const priceData = await this.priceOracle.getHistoricalPrice({
      tokenMint: tx.tokenMint,
      blockTime: tx.blockTime,
      slot: tx.slot,
    });

    // Calculate USD values
    const originalAmountUsd = amount * priceData.price;
    const spareChangeUsd = finalSpareChange * priceData.price;

    const proposal: CreateContributionProposal = {
      walletAddress,
      transactionSignature: tx.signature,
      transactionTimestamp: tx.timestamp,
      transactionSlot: tx.slot,
      originalAmountSol: amount,
      originalAmountUsd,
      tokenMint: tx.tokenMint,
      tokenSymbol: tx.tokenSymbol || (tx.tokenMint ? undefined : 'SOL'),
      solPriceUsd: tx.tokenMint ? undefined : priceData.price,
      tokenPriceUsd: tx.tokenMint ? priceData.price : undefined,
      priceSource: priceData.source === 'cached' ? 'jupiter' : priceData.source,
      proposalType: 'percentage',
      percentageRate: config.percentageRate,
      spareChangeAmountSol: finalSpareChange,
      spareChangeAmountUsd: spareChangeUsd,
      status: 'pending',
    };

    return proposal;
  }

  /**
   * Calculate spare change summary for a set of transactions
   * Useful for previewing without creating proposals
   */
  async calculateSpareChangeSummary(
    transactions: TransactionDetails[],
    config: ProposalConfig
  ): Promise<{
    roundupTotal: number;
    percentageTotal: number;
    total: number;
    transactionCount: number;
  }> {
    const sentTransactions = transactions.filter(tx => tx.type === 'sent' && tx.success && tx.amount);

    let roundupTotal = 0;
    let percentageTotal = 0;

    for (const tx of sentTransactions) {
      if (!tx.amount) continue;

      // Calculate round-up
      if (config.roundupEnabled) {
        const roundedUp = Math.ceil(tx.amount);
        const spareChange = roundedUp - tx.amount;
        const finalSpareChange = config.maxProposalAmount
          ? Math.min(spareChange, config.maxProposalAmount)
          : spareChange;

        if (!config.minProposalAmount || finalSpareChange >= config.minProposalAmount) {
          roundupTotal += finalSpareChange;
        }
      }

      // Calculate percentage
      if (config.percentageEnabled && config.percentageRate > 0) {
        const spareChange = tx.amount * (config.percentageRate / 100);
        const finalSpareChange = config.maxProposalAmount
          ? Math.min(spareChange, config.maxProposalAmount)
          : spareChange;

        if (!config.minProposalAmount || finalSpareChange >= config.minProposalAmount) {
          percentageTotal += finalSpareChange;
        }
      }
    }

    return {
      roundupTotal,
      percentageTotal,
      total: roundupTotal + percentageTotal,
      transactionCount: sentTransactions.length,
    };
  }
}
