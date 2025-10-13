/**
 * Solana transaction fetching service
 * Fetches and parses transactions for a given wallet address
 */

import { Connection, PublicKey, ParsedTransactionWithMeta, ConfirmedSignatureInfo } from '@solana/web3.js';
import { config } from '../config';
import { IWalletProvider } from '../wallet/interface';

export interface TransactionDetails {
  signature: string;
  slot: number;
  blockTime: number;
  timestamp: Date;
  fee: number;
  success: boolean;
  type: 'sent' | 'received' | 'unknown';
  amount?: number;
  tokenMint?: string;
  tokenSymbol?: string;
  from?: string;
  to?: string;
}

export interface FetchTransactionsOptions {
  lookbackDays?: number;
  limit?: number;
  before?: string;
  until?: string;
}

export class TransactionFetcher {
  private connection: Connection;

  constructor() {
    const solanaConfig = config.getSolanaConfig();
    this.connection = new Connection(solanaConfig.rpcUrl, solanaConfig.commitment);
  }

  /**
   * Fetch transactions for a wallet address
   */
  async fetchTransactions(
    walletProvider: IWalletProvider,
    options: FetchTransactionsOptions = {}
  ): Promise<TransactionDetails[]> {
    const publicKey = await walletProvider.getPublicKey();
    const lookbackDays = options.lookbackDays || config.getTransactionLookbackDays();
    const limit = options.limit || 1000;

    // Calculate the timestamp for lookback period
    const now = Date.now();
    const lookbackTimestamp = Math.floor(now / 1000) - (lookbackDays * 24 * 60 * 60);

    try {
      // Fetch transaction signatures
      const signatures = await this.fetchSignatures(publicKey, limit, options.before);

      // Filter by timestamp if needed
      const filteredSignatures = signatures.filter(sig => {
        if (!sig.blockTime) return false;
        return sig.blockTime >= lookbackTimestamp;
      });

      // Fetch and parse transaction details
      const transactions = await this.fetchTransactionDetails(publicKey, filteredSignatures);

      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error(`Failed to fetch transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch transaction signatures for a public key
   */
  private async fetchSignatures(
    publicKey: PublicKey,
    limit: number,
    before?: string
  ): Promise<ConfirmedSignatureInfo[]> {
    try {
      const options: { limit: number; before?: string } = { limit };
      if (before) {
        options.before = before;
      }

      const signatures = await this.connection.getSignaturesForAddress(publicKey, options);
      return signatures;
    } catch (error) {
      console.error('Error fetching signatures:', error);
      throw error;
    }
  }

  /**
   * Fetch and parse transaction details
   */
  private async fetchTransactionDetails(
    walletPublicKey: PublicKey,
    signatures: ConfirmedSignatureInfo[]
  ): Promise<TransactionDetails[]> {
    const transactions: TransactionDetails[] = [];

    // Fetch transactions sequentially to avoid rate limits on public RPC
    // For production, use a paid RPC provider for better rate limits
    for (const sig of signatures) {
      try {
        const tx = await this.parseTransaction(walletPublicKey, sig);
        if (tx) {
          transactions.push(tx);
        }
        // Delay between each request to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Failed to parse transaction ${sig.signature}:`, error);
        // Continue with next transaction even if one fails
      }
    }

    return transactions;
  }

  /**
   * Parse a single transaction
   */
  private async parseTransaction(
    walletPublicKey: PublicKey,
    signatureInfo: ConfirmedSignatureInfo
  ): Promise<TransactionDetails | null> {
    try {
      const tx = await this.connection.getParsedTransaction(signatureInfo.signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx || !tx.blockTime) {
        return null;
      }

      const details = this.extractTransactionDetails(walletPublicKey, tx, signatureInfo);
      return details;
    } catch (error) {
      console.error(`Error parsing transaction ${signatureInfo.signature}:`, error);
      return null;
    }
  }

  /**
   * Extract relevant details from a parsed transaction
   */
  private extractTransactionDetails(
    walletPublicKey: PublicKey,
    tx: ParsedTransactionWithMeta,
    signatureInfo: ConfirmedSignatureInfo
  ): TransactionDetails {
    const walletAddress = walletPublicKey.toString();

    // Basic transaction info
    const details: TransactionDetails = {
      signature: signatureInfo.signature,
      slot: signatureInfo.slot,
      blockTime: tx.blockTime!,
      timestamp: new Date(tx.blockTime! * 1000),
      fee: tx.meta?.fee || 0,
      success: !signatureInfo.err && !tx.meta?.err,
      type: 'unknown',
    };

    // Analyze pre and post balances to determine transaction type and amount
    if (tx.meta && tx.transaction.message.accountKeys) {
      const walletIndex = tx.transaction.message.accountKeys.findIndex(
        key => key.pubkey.toString() === walletAddress
      );

      if (walletIndex !== -1) {
        const preBalance = tx.meta.preBalances[walletIndex];
        const postBalance = tx.meta.postBalances[walletIndex];
        const balanceChange = postBalance - preBalance;

        // Determine transaction type (excluding fee)
        if (balanceChange < -details.fee) {
          details.type = 'sent';
          details.amount = Math.abs(balanceChange + details.fee) / 1e9; // Convert lamports to SOL
        } else if (balanceChange > 0) {
          details.type = 'received';
          details.amount = balanceChange / 1e9;
        }

        // Try to extract token information from parsed instructions
        this.extractTokenInfo(tx, details);
      }
    }

    return details;
  }

  /**
   * Extract token information from transaction instructions
   */
  private extractTokenInfo(tx: ParsedTransactionWithMeta, details: TransactionDetails): void {
    if (!tx.meta?.postTokenBalances || !tx.meta?.preTokenBalances) {
      return;
    }

    // Look for token transfers
    for (const postBalance of tx.meta.postTokenBalances) {
      const preBalance = tx.meta.preTokenBalances.find(
        pre => pre.accountIndex === postBalance.accountIndex
      );

      if (preBalance && postBalance.mint) {
        const preAmount = parseFloat(preBalance.uiTokenAmount.uiAmountString || '0');
        const postAmount = parseFloat(postBalance.uiTokenAmount.uiAmountString || '0');
        const change = postAmount - preAmount;

        if (Math.abs(change) > 0) {
          details.tokenMint = postBalance.mint;
          details.tokenSymbol = this.getTokenSymbol(postBalance.mint);

          // Override amount if this is a token transfer
          if (details.type === 'sent' || details.type === 'received') {
            details.amount = Math.abs(change);
          }
        }
      }
    }
  }

  /**
   * Get token symbol from mint address
   * This is a simple mapping - in production, you'd want a more comprehensive solution
   */
  private getTokenSymbol(mint: string): string {
    const knownTokens: { [key: string]: string } = {
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC', // Mainnet USDC
      '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU': 'USDC', // Devnet USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
      'So11111111111111111111111111111111111111112': 'SOL',
    };

    return knownTokens[mint] || 'UNKNOWN';
  }

  /**
   * Get a fresh connection (useful for reconnecting after errors)
   */
  refreshConnection(): void {
    const solanaConfig = config.getSolanaConfig();
    this.connection = new Connection(solanaConfig.rpcUrl, solanaConfig.commitment);
  }
}
