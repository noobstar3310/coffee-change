// Network configuration
export const NETWORK_CONFIG = {
  // Change this to switch networks
  CURRENT_NETWORK: 'devnet' as 'mainnet' | 'devnet',
  
  mainnet: {
    RPC_ENDPOINT: "https://api.mainnet-beta.solana.com",
    WS_ENDPOINT: "wss://api.mainnet-beta.solana.com",
    CHAIN: "solana:mainnet",
    USDC_MINT: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    DISPLAY_NAME: "Solana Mainnet"
  },
  
  devnet: {
    RPC_ENDPOINT: "https://api.devnet.solana.com",
    WS_ENDPOINT: "wss://api.devnet.solana.com", 
    CHAIN: "solana:devnet",
    USDC_MINT: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // Devnet USDC
    DISPLAY_NAME: "Solana Devnet"
  }
};

// Get current network config
export const getCurrentNetworkConfig = () => {
  return NETWORK_CONFIG[NETWORK_CONFIG.CURRENT_NETWORK];
};
