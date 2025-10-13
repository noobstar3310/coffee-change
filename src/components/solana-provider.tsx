"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import {
  useWallets,
  type UiWallet,
  type UiWalletAccount
} from "@wallet-standard/react";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { StandardConnect } from "@wallet-standard/core";
import { getCurrentNetworkConfig } from "@/lib/config";

// Get current network configuration
const networkConfig = getCurrentNetworkConfig();
console.log('Using RPC endpoint:', networkConfig.RPC_ENDPOINT);
const rpc = createSolanaRpc(networkConfig.RPC_ENDPOINT);
const ws = createSolanaRpcSubscriptions(networkConfig.WS_ENDPOINT);

interface SolanaContextState {
  // RPC
  rpc: ReturnType<typeof createSolanaRpc>;
  ws: ReturnType<typeof createSolanaRpcSubscriptions>;
  chain: `solana:${string}`;
  networkName: string;

  // Wallet State
  wallets: UiWallet[];
  selectedWallet: UiWallet | null;
  selectedAccount: UiWalletAccount | null;
  isConnected: boolean;

  // Balance State
  solBalance: number | null;
  usdcBalance: number | null;
  isLoadingBalances: boolean;

  // Wallet Actions
  setWalletAndAccount: (
    wallet: UiWallet | null,
    account: UiWalletAccount | null
  ) => void;
  fetchBalances: () => Promise<void>;
}

const SolanaContext = createContext<SolanaContextState | undefined>(undefined);

export function useSolana() {
  const context = useContext(SolanaContext);
  if (!context) {
    throw new Error("useSolana must be used within a SolanaProvider");
  }
  return context;
}

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const allWallets = useWallets();

  // Filter for Solana wallets only that support signAndSendTransaction
  const wallets = useMemo(() => {
    return allWallets.filter(
      (wallet) =>
        wallet.chains?.some((c) => c.startsWith("solana:")) &&
        wallet.features.includes(StandardConnect) &&
        wallet.features.includes("solana:signAndSendTransaction")
    );
  }, [allWallets]);

  // State management
  const [selectedWallet, setSelectedWallet] = useState<UiWallet | null>(null);
  const [selectedAccount, setSelectedAccount] =
    useState<UiWalletAccount | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Check if connected (account must exist in the wallet's accounts)
  const isConnected = useMemo(() => {
    if (!selectedAccount || !selectedWallet) return false;

    // Find the wallet and check if it still has this account
    const currentWallet = wallets.find((w) => w.name === selectedWallet.name);
    return !!(
      currentWallet &&
      currentWallet.accounts.some(
        (acc) => acc.address === selectedAccount.address
      )
    );
  }, [selectedAccount, selectedWallet, wallets]);

  const fetchBalances = async () => {
    if (!selectedAccount || !isConnected) return;
    
    setIsLoadingBalances(true);
    try {
      console.log('Fetching balance for address:', selectedAccount.address);
      console.log('Using RPC endpoint:', networkConfig.RPC_ENDPOINT);
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Fetch SOL balance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const solBalanceResponse = await rpc.getBalance(selectedAccount.address as any).send();
      console.log('SOL balance response:', solBalanceResponse);
      
      const solLamports = solBalanceResponse.value;
      console.log('Extracted lamports:', solLamports);
      
      setSolBalance(Number(solLamports) / 1e9); // Convert lamports to SOL

      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 300));

      // Fetch USDC balance using getTokenAccountsByOwner
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tokenAccounts = await rpc.getTokenAccountsByOwner(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          selectedAccount.address as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { mint: networkConfig.USDC_MINT as any }
        ).send();

        if (tokenAccounts.value.length > 0) {
          const tokenAccount = tokenAccounts.value[0];
          const accountData = Buffer.from(tokenAccount.account.data, 'base64');
          // Token account balance is at bytes 64-72 (8 bytes, little endian)
          const balanceBytes = accountData.slice(64, 72);
          const balance = new DataView(balanceBytes.buffer).getBigUint64(0, true);
          setUsdcBalance(Number(balance) / 1_000_000); // USDC has 6 decimals
        } else {
          setUsdcBalance(0);
        }
      } catch (usdcError) {
        console.log("No USDC account found or error fetching USDC:", usdcError);
        setUsdcBalance(0);
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
      setSolBalance(null);
      setUsdcBalance(null);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const setWalletAndAccount = (
    wallet: UiWallet | null,
    account: UiWalletAccount | null
  ) => {
    setSelectedWallet(wallet);
    setSelectedAccount(account);
    if (account) {
      fetchBalances();
    } else {
      setSolBalance(null);
      setUsdcBalance(null);
    }
  };

  // Create context value
  const contextValue = useMemo<SolanaContextState>(
    () => ({
      // Static RPC values
      rpc,
      ws,
      chain: networkConfig.CHAIN as `solana:${string}`,
      networkName: networkConfig.DISPLAY_NAME,

      // Dynamic wallet values
      wallets,
      selectedWallet,
      selectedAccount,
      isConnected,
      
      // Balance values
      solBalance,
      usdcBalance,
      isLoadingBalances,
      
      // Actions
      setWalletAndAccount,
      fetchBalances
    }),
    [wallets, selectedWallet, selectedAccount, isConnected, solBalance, usdcBalance, isLoadingBalances]
  );

  return (
    <SolanaContext.Provider value={contextValue}>
      {children}
    </SolanaContext.Provider>
  );
}