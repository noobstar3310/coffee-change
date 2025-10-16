import { supabase } from '../db/supabase-client';
import { Transaction, PayoutBatch } from '../db/supabase-types';
import { TransactionFetcher, TransactionDetails } from './transaction-fetcher';
import { PriceOracle } from './price-oracle';
import { UserService } from './user-service';
import { WalletFactory } from '../wallet/interface';

export class TransactionTrackingService {
  private transactionFetcher: TransactionFetcher;
  private priceOracle: PriceOracle;
  private userService: UserService;

  constructor() {
    this.transactionFetcher = new TransactionFetcher();
    this.priceOracle = new PriceOracle();
    this.userService = new UserService();
  }

  /**
   * Sync new transactions for a wallet
   */
  async syncTransactions(walletAddress: string): Promise<{
    newTransactionCount: number;
    newTransactions: Transaction[];
    payoutTriggered: boolean;
    batchesCreated: PayoutBatch[];
  }> {
    // Get user
    const user = await this.userService.getUser(walletAddress);
    if (!user) {
      throw new Error('User not found. Please connect wallet first.');
    }

    // Fetch recent transactions
    const walletProvider = WalletFactory.createTypedAddress(walletAddress);
    const allTransactions = await this.transactionFetcher.fetchTransactions(walletProvider, {
      lookbackDays: 30,
      limit: 100,
    });

    // Filter for new transactions (after last recorded transaction)
    const newTransactions = this.filterNewTransactions(
      allTransactions,
      user.last_transaction_signature
    );

    if (newTransactions.length === 0) {
      return {
        newTransactionCount: 0,
        newTransactions: [],
        payoutTriggered: false,
        batchesCreated: [],
      };
    }

    // Process only "sent" transactions
    const sentTransactions = newTransactions.filter(tx => tx.type === 'sent' && tx.success && tx.amount);

    const processedTransactions: Transaction[] = [];

    for (const tx of sentTransactions) {
      const processed = await this.processTransaction(tx, user.id, walletAddress);
      if (processed) {
        processedTransactions.push(processed);
      }
    }

    // Update user's last transaction
    if (newTransactions.length > 0) {
      const latestTx = newTransactions[0];
      await this.userService.updateLastTransaction(
        walletAddress,
        latestTx.signature,
        latestTx.timestamp
      );
    }

    // Check if payout threshold reached
    const updatedUser = await this.userService.getUser(walletAddress);
    const payoutThreshold = 1.00; // $1.00 USD
    const batchesCreated: PayoutBatch[] = [];

    if (updatedUser && updatedUser.current_accumulated_spare_change_usd >= payoutThreshold) {
      const batch = await this.createPayoutBatch(updatedUser.id, walletAddress);
      batchesCreated.push(batch);
    }

    return {
      newTransactionCount: processedTransactions.length,
      newTransactions: processedTransactions,
      payoutTriggered: batchesCreated.length > 0,
      batchesCreated,
    };
  }

  /**
   * Filter for transactions newer than the last recorded one
   */
  private filterNewTransactions(
    transactions: TransactionDetails[],
    lastSignature: string | null
  ): TransactionDetails[] {
    if (!lastSignature) {
      return transactions;
    }

    const lastIndex = transactions.findIndex(tx => tx.signature === lastSignature);
    if (lastIndex === -1) {
      // Last transaction not found, return all
      return transactions;
    }

    // Return only transactions before the last index (newer transactions)
    return transactions.slice(0, lastIndex);
  }

  /**
   * Process a single transaction and calculate spare change
   */
  private async processTransaction(
    tx: TransactionDetails,
    userId: string,
    walletAddress: string
  ): Promise<Transaction | null> {
    if (!tx.amount) return null;

    // Get price at block time
    const priceData = await this.priceOracle.getHistoricalPrice({
      tokenMint: tx.tokenMint,
      blockTime: tx.blockTime,
      slot: tx.slot,
    });

    // Calculate USD value
    const originalAmountUsd = tx.amount * priceData.price;

    // Round up to nearest dollar
    const roundedUpUsd = Math.ceil(originalAmountUsd);
    const spareChangeUsd = roundedUpUsd - originalAmountUsd;

    // Convert spare change back to SOL
    const spareChangeSol = spareChangeUsd / priceData.price;

    // Store transaction in database
    const { data: dbTransaction, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        wallet_address: walletAddress,
        signature: tx.signature,
        timestamp: tx.timestamp.toISOString(),
        slot: tx.slot,
        block_time: tx.blockTime,
        original_amount_sol: tx.amount,
        original_amount_usd: originalAmountUsd,
        spare_change_amount_usd: spareChangeUsd,
        spare_change_amount_sol: spareChangeSol,
        sol_price_usd: priceData.price,
        is_processed: false,
        batch_id: null,
      })
      .select()
      .single();

    if (error) {
      console.error(`Error storing transaction ${tx.signature}:`, error);
      return null;
    }

    // Update user's accumulated spare change
    await this.userService.updateAccumulatedSpareChange(
      walletAddress,
      spareChangeUsd,
      spareChangeSol
    );

    return dbTransaction;
  }

  /**
   * Create a payout batch when threshold is reached
   */
  private async createPayoutBatch(userId: string, walletAddress: string): Promise<PayoutBatch> {
    // Get all unprocessed transactions
    const { data: unprocessedTransactions, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('is_processed', false)
      .order('timestamp', { ascending: true });

    if (fetchError) {
      throw new Error(`Error fetching unprocessed transactions: ${fetchError.message}`);
    }

    if (!unprocessedTransactions || unprocessedTransactions.length === 0) {
      throw new Error('No unprocessed transactions found');
    }

    // Calculate totals
    const totalSpareChangeUsd = unprocessedTransactions.reduce(
      (sum, tx) => sum + tx.spare_change_amount_usd,
      0
    );
    const totalSpareChangeSol = unprocessedTransactions.reduce(
      (sum, tx) => sum + tx.spare_change_amount_sol,
      0
    );

    // Create payout batch
    const { data: batch, error: batchError } = await supabase
      .from('payout_batches')
      .insert({
        user_id: userId,
        wallet_address: walletAddress,
        total_spare_change_usd: totalSpareChangeUsd,
        total_spare_change_sol: totalSpareChangeSol,
        transaction_count: unprocessedTransactions.length,
        status: 'pending',
      })
      .select()
      .single();

    if (batchError) {
      throw new Error(`Error creating payout batch: ${batchError.message}`);
    }

    // Mark transactions as processed and link to batch
    const transactionIds = unprocessedTransactions.map(tx => tx.id);
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        is_processed: true,
        batch_id: batch.id,
      })
      .in('id', transactionIds);

    if (updateError) {
      throw new Error(`Error updating transactions: ${updateError.message}`);
    }

    // Reset user's accumulated spare change
    await this.userService.resetAccumulatedSpareChange(walletAddress);

    return batch;
  }

  /**
   * Get wallet status
   */
  async getWalletStatus(walletAddress: string) {
    const user = await this.userService.getUser(walletAddress);
    if (!user) {
      throw new Error('User not found');
    }

    // Get recent transactions
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('timestamp', { ascending: false })
      .limit(10);

    // Get recent payout batches
    const { data: recentBatches } = await supabase
      .from('payout_batches')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })
      .limit(5);

    // Count pending transactions
    const { count: pendingCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('wallet_address', walletAddress)
      .eq('is_processed', false);

    return {
      user: {
        walletAddress: user.wallet_address,
        firstConnectedAt: user.first_connected_at,
        totalPayouts: user.total_payouts,
      },
      summary: {
        currentAccumulated: {
          usd: user.current_accumulated_spare_change_usd,
          sol: user.current_accumulated_spare_change_sol,
        },
        lifetimeTotal: {
          usd: user.total_lifetime_spare_change_usd,
          sol: user.total_lifetime_spare_change_sol,
        },
        pendingTransactionCount: pendingCount || 0,
        readyForPayout: user.current_accumulated_spare_change_usd >= 1.00,
        nextPayoutAt: Math.max(0, 1.00 - user.current_accumulated_spare_change_usd),
      },
      recentTransactions: recentTransactions || [],
      recentBatches: recentBatches || [],
    };
  }
}
