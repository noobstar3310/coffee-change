/**
 * TypeScript types for database models
 */

export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'executed';
export type ProposalType = 'roundup' | 'percentage';
export type PriceSource = 'pyth' | 'jupiter' | 'manual';

export interface ContributionProposal {
  id: number;

  // Wallet information
  walletAddress: string;

  // Transaction reference
  transactionSignature: string;
  transactionTimestamp: Date;
  transactionSlot?: number;

  // Original transaction details
  originalAmountSol: number;
  originalAmountUsd?: number;
  tokenMint?: string;
  tokenSymbol?: string;

  // Price data at block time
  solPriceUsd?: number;
  tokenPriceUsd?: number;
  priceSource?: PriceSource;

  // Spare change calculation
  proposalType: ProposalType;
  percentageRate?: number;
  spareChangeAmountSol: number;
  spareChangeAmountUsd?: number;

  // Proposal status
  status: ProposalStatus;

  // Execution details
  executionSignature?: string;
  executionTimestamp?: Date;
  executionError?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface UserPreferences {
  id: number;
  walletAddress: string;

  // Spare change settings
  roundupEnabled: boolean;
  percentageEnabled: boolean;
  percentageRate: number;

  // Notification preferences
  notifyOnProposal: boolean;
  notifyOnExecution: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionCache {
  id: number;
  walletAddress: string;
  transactionSignature: string;
  slot: number;
  blockTime: Date;
  transactionData: string; // JSON string
  cachedAt: Date;
}

// Helper types for creating new records
export type CreateContributionProposal = Omit<ContributionProposal, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateUserPreferences = Omit<UserPreferences, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateTransactionCache = Omit<TransactionCache, 'id' | 'cachedAt'>;
