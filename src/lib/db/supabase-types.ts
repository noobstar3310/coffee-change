export interface User {
  id: string;
  wallet_address: string;
  created_at: string;
  first_connected_at: string;
  last_transaction_signature: string | null;
  last_transaction_timestamp: Date | null;
  current_accumulated_spare_change_usd: number;
  current_accumulated_spare_change_sol: number;
  total_lifetime_spare_change_usd: number;
  total_lifetime_spare_change_sol: number;
  total_payouts: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_address: string;
  signature: string;
  timestamp: Date;
  slot: number;
  block_time: number;
  original_amount_sol: number;
  original_amount_usd: number;
  spare_change_amount_usd: number;
  spare_change_amount_sol: number;
  sol_price_usd: number;
  is_processed: boolean;
  batch_id: string | null;
  created_at: string;
}

export interface PayoutBatch {
  id: string;
  user_id: string;
  wallet_address: string;
  created_at: string;
  total_spare_change_usd: number;
  total_spare_change_sol: number;
  transaction_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  blockchain_signature: string | null;
  processed_at: Date | null;
}
