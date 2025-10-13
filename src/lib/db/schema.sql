-- Database schema for contribution_proposals
-- Compatible with PostgreSQL and SQLite

-- Contribution proposals table
CREATE TABLE IF NOT EXISTS contribution_proposals (
  id SERIAL PRIMARY KEY,

  -- Wallet information
  wallet_address VARCHAR(44) NOT NULL,

  -- Transaction reference
  transaction_signature VARCHAR(88) NOT NULL,
  transaction_timestamp TIMESTAMP NOT NULL,
  transaction_slot BIGINT,

  -- Original transaction details
  original_amount_sol DECIMAL(20, 9) NOT NULL,
  original_amount_usd DECIMAL(20, 2),
  token_mint VARCHAR(44), -- For non-SOL tokens
  token_symbol VARCHAR(20), -- e.g., 'USDC', 'SOL'

  -- Price data at block time
  sol_price_usd DECIMAL(20, 2),
  token_price_usd DECIMAL(20, 2),
  price_source VARCHAR(20), -- 'pyth', 'jupiter', 'manual'

  -- Spare change calculation
  proposal_type VARCHAR(20) NOT NULL, -- 'roundup' or 'percentage'
  percentage_rate DECIMAL(5, 2), -- For percentage-based (e.g., 1.00 = 1%)
  spare_change_amount_sol DECIMAL(20, 9) NOT NULL,
  spare_change_amount_usd DECIMAL(20, 2),

  -- Proposal status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'executed'

  -- Execution details
  execution_signature VARCHAR(88),
  execution_timestamp TIMESTAMP,
  execution_error TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Notes
  notes TEXT,

  -- Indexes for common queries
  CONSTRAINT unique_transaction_proposal UNIQUE(wallet_address, transaction_signature, proposal_type)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_wallet_address ON contribution_proposals(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transaction_signature ON contribution_proposals(transaction_signature);
CREATE INDEX IF NOT EXISTS idx_status ON contribution_proposals(status);
CREATE INDEX IF NOT EXISTS idx_created_at ON contribution_proposals(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_status ON contribution_proposals(wallet_address, status);

-- User preferences table (optional, for future use)
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(44) NOT NULL UNIQUE,

  -- Spare change settings
  roundup_enabled BOOLEAN DEFAULT TRUE,
  percentage_enabled BOOLEAN DEFAULT FALSE,
  percentage_rate DECIMAL(5, 2) DEFAULT 1.00,

  -- Notification preferences
  notify_on_proposal BOOLEAN DEFAULT TRUE,
  notify_on_execution BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transaction cache table (optional, for caching fetched transactions)
CREATE TABLE IF NOT EXISTS transaction_cache (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(44) NOT NULL,
  transaction_signature VARCHAR(88) NOT NULL,
  slot BIGINT NOT NULL,
  block_time TIMESTAMP NOT NULL,

  -- Transaction data (stored as JSONB for flexibility)
  transaction_data TEXT NOT NULL, -- JSON string

  -- Metadata
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_transaction_cache UNIQUE(wallet_address, transaction_signature)
);

CREATE INDEX IF NOT EXISTS idx_cache_wallet ON transaction_cache(wallet_address);
CREATE INDEX IF NOT EXISTS idx_cache_block_time ON transaction_cache(block_time);
