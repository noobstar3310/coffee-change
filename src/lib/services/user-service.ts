import { supabase } from '../db/supabase-client';
import { User } from '../db/supabase-types';
import { WalletFactory } from '../wallet/interface';

export class UserService {
  /**
   * Connect or retrieve user by wallet address
   */
  async connectWallet(walletAddress: string): Promise<{ user: User; isFirstTime: boolean; lastTransaction: { signature: string; timestamp: Date } | null }> {
    // Validate wallet address
    const walletProvider = WalletFactory.createTypedAddress(walletAddress);
    const publicKey = await walletProvider.getPublicKey();

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      throw new Error(`Error fetching user: ${fetchError.message}`);
    }

    if (existingUser) {
      // User exists, return existing data
      return {
        user: existingUser,
        isFirstTime: false,
        lastTransaction: existingUser.last_transaction_signature ? {
          signature: existingUser.last_transaction_signature,
          timestamp: new Date(existingUser.last_transaction_timestamp),
        } : null,
      };
    }

    // New user - fetch their latest transaction to set baseline
    const { TransactionFetcher } = await import('./transaction-fetcher');
    const transactionFetcher = new TransactionFetcher();

    let lastTransactionSignature: string | null = null;
    let lastTransactionTimestamp: Date | null = null;

    try {
      const transactions = await transactionFetcher.fetchTransactions(walletProvider, {
        limit: 1,
        lookbackDays: 365,
      });

      if (transactions.length > 0) {
        const latestTx = transactions[0];
        lastTransactionSignature = latestTx.signature;
        lastTransactionTimestamp = latestTx.timestamp;
        console.log(`Onboarding new user: ${walletAddress} - baseline set to transaction ${lastTransactionSignature}`);
      } else {
        console.log(`Onboarding new user: ${walletAddress} - no transactions found, starting fresh`);
      }
    } catch (error) {
      console.error('Error fetching latest transaction for onboarding:', error);
      // Continue with null values if fetch fails
    }

    // Create new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        wallet_address: walletAddress,
        first_connected_at: new Date().toISOString(),
        last_transaction_signature: lastTransactionSignature,
        last_transaction_timestamp: lastTransactionTimestamp,
        current_accumulated_spare_change_usd: 0,
        current_accumulated_spare_change_sol: 0,
        total_lifetime_spare_change_usd: 0,
        total_lifetime_spare_change_sol: 0,
        total_payouts: 0,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error creating user: ${insertError.message}`);
    }

    return {
      user: newUser,
      isFirstTime: true,
      lastTransaction: lastTransactionSignature ? {
        signature: lastTransactionSignature,
        timestamp: lastTransactionTimestamp!,
      } : null,
    };
  }

  /**
   * Get user by wallet address
   */
  async getUser(walletAddress: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new Error(`Error fetching user: ${error.message}`);
    }

    return data;
  }

  /**
   * Update user's last transaction
   */
  async updateLastTransaction(walletAddress: string, signature: string, timestamp: Date): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        last_transaction_signature: signature,
        last_transaction_timestamp: timestamp.toISOString(),
      })
      .eq('wallet_address', walletAddress);

    if (error) {
      throw new Error(`Error updating last transaction: ${error.message}`);
    }
  }

  /**
   * Update user's accumulated spare change
   */
  async updateAccumulatedSpareChange(
    walletAddress: string,
    spareChangeUsd: number,
    spareChangeSol: number
  ): Promise<void> {
    const user = await this.getUser(walletAddress);
    if (!user) throw new Error('User not found');

    const newAccumulatedUsd = user.current_accumulated_spare_change_usd + spareChangeUsd;
    const newAccumulatedSol = user.current_accumulated_spare_change_sol + spareChangeSol;

    const { error } = await supabase
      .from('users')
      .update({
        current_accumulated_spare_change_usd: newAccumulatedUsd,
        current_accumulated_spare_change_sol: newAccumulatedSol,
        total_lifetime_spare_change_usd: user.total_lifetime_spare_change_usd + spareChangeUsd,
        total_lifetime_spare_change_sol: user.total_lifetime_spare_change_sol + spareChangeSol,
      })
      .eq('wallet_address', walletAddress);

    if (error) {
      throw new Error(`Error updating accumulated spare change: ${error.message}`);
    }
  }

  /**
   * Reset accumulated spare change (after payout)
   */
  async resetAccumulatedSpareChange(walletAddress: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        current_accumulated_spare_change_usd: 0,
        current_accumulated_spare_change_sol: 0,
        total_payouts: supabase.sql`total_payouts + 1`,
      })
      .eq('wallet_address', walletAddress);

    if (error) {
      throw new Error(`Error resetting accumulated spare change: ${error.message}`);
    }
  }
}
