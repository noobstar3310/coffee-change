/**
 * Configuration management for Solana cluster and environment settings
 */

export type SolanaCluster = 'mainnet-beta' | 'devnet' | 'testnet';

export interface NetworkConfig {
  RPC_ENDPOINT: string;
  WS_ENDPOINT: string;
  CHAIN: string;
  USDC_MINT: string;
  DISPLAY_NAME: string;
}

export interface SolanaConfig {
  cluster: SolanaCluster;
  rpcUrl: string;
  commitment: 'processed' | 'confirmed' | 'finalized';
}

export interface PriceOracleConfig {
  pythSolUsdFeed: string;
  pythUsdcUsdFeed: string;
  jupiterApiUrl: string;
}

export interface AppConfig {
  solana: SolanaConfig;
  priceOracle: PriceOracleConfig;
  transactionLookbackDays: number;
  defaultRoundupEnabled: boolean;
  defaultPercentageEnabled: boolean;
  defaultPercentageRate: number;
}

// Legacy network configuration (keeping for backward compatibility)
export const NETWORK_CONFIG = {
  // Change this to switch networks
  CURRENT_NETWORK: (process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'devnet') as 'mainnet' | 'devnet',

  mainnet: {
    RPC_ENDPOINT: process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC_URL || "https://api.mainnet-beta.solana.com",
    WS_ENDPOINT: "wss://api.mainnet-beta.solana.com",
    CHAIN: "solana:mainnet",
    USDC_MINT: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    DISPLAY_NAME: "Solana Mainnet"
  },

  devnet: {
    RPC_ENDPOINT: process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL || "https://api.devnet.solana.com",
    WS_ENDPOINT: "wss://api.devnet.solana.com",
    CHAIN: "solana:devnet",
    USDC_MINT: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // Devnet USDC
    DISPLAY_NAME: "Solana Devnet"
  }
};

// Get current network config (legacy)
export const getCurrentNetworkConfig = () => {
  return NETWORK_CONFIG[NETWORK_CONFIG.CURRENT_NETWORK];
};

// New configuration manager for backend services
class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    const cluster = (process.env.SOLANA_CLUSTER || 'mainnet-beta') as SolanaCluster;

    this.config = {
      solana: {
        cluster,
        rpcUrl: this.getRpcUrl(cluster),
        commitment: 'confirmed',
      },
      priceOracle: {
        pythSolUsdFeed: process.env.PYTH_PRICE_FEED_SOL_USD || 'H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG',
        pythUsdcUsdFeed: process.env.PYTH_PRICE_FEED_USDC_USD || 'Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD',
        jupiterApiUrl: process.env.JUPITER_PRICE_API_URL || 'https://price.jup.ag/v6',
      },
      transactionLookbackDays: parseInt(process.env.TRANSACTION_LOOKBACK_DAYS || '30', 10),
      defaultRoundupEnabled: process.env.DEFAULT_ROUNDUP_ENABLED !== 'false',
      defaultPercentageEnabled: process.env.DEFAULT_PERCENTAGE_ENABLED === 'true',
      defaultPercentageRate: parseFloat(process.env.DEFAULT_PERCENTAGE_RATE || '1.0'),
    };
  }

  private getRpcUrl(cluster: SolanaCluster): string {
    switch (cluster) {
      case 'mainnet-beta':
        return process.env.SOLANA_MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com';
      case 'devnet':
        return process.env.SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com';
      case 'testnet':
        return process.env.SOLANA_TESTNET_RPC_URL || 'https://api.testnet.solana.com';
      default:
        return 'https://api.mainnet-beta.solana.com';
    }
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public getSolanaConfig(): SolanaConfig {
    return this.config.solana;
  }

  public getPriceOracleConfig(): PriceOracleConfig {
    return this.config.priceOracle;
  }

  public getTransactionLookbackDays(): number {
    return this.config.transactionLookbackDays;
  }

  public setCluster(cluster: SolanaCluster): void {
    this.config.solana.cluster = cluster;
    this.config.solana.rpcUrl = this.getRpcUrl(cluster);
  }

  public isMainnet(): boolean {
    return this.config.solana.cluster === 'mainnet-beta';
  }

  public isDevnet(): boolean {
    return this.config.solana.cluster === 'devnet';
  }
}

export const config = ConfigManager.getInstance();
