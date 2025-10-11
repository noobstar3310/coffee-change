"use client";

import { useState, useEffect } from "react";
import { useSolana } from "@/components/solana-provider";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Wallet, Clock, DollarSign, TrendingUp, Coffee } from "lucide-react";

interface TransactionData {
  hash: string;
  timestamp: string;
  amount: number;
  type: 'sent' | 'received';
}

interface RoundUpData {
  totalUsd: number;
  solEquivalent: number;
  usdcEquivalent: number;
  lastSync: string;
}

interface DashboardProps {
  onReviewRoundUp?: () => void;
  onViewPosition?: () => void;
}

export function Dashboard({ onReviewRoundUp, onViewPosition }: DashboardProps) {
  const { selectedAccount, isConnected, solBalance, usdcBalance, isLoadingBalances, fetchBalances, networkName } = useSolana();
  const [lastTransaction, setLastTransaction] = useState<TransactionData | null>(null);
  const [roundUpData, setRoundUpData] = useState<RoundUpData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data for development - replace with actual API calls
  useEffect(() => {
    if (isConnected && selectedAccount) {

      // Mock last transaction
      setLastTransaction({
        hash: "3Kj8...9Xm2",
        timestamp: "5 min ago",
        amount: 0.5,
        type: 'sent'
      });

      // Mock round-up data
      setRoundUpData({
        totalUsd: 3.25,
        solEquivalent: 0.018,
        usdcEquivalent: 3.25,
        lastSync: "12/15/2024 – 14:30"
      });
    }
  }, [isConnected, selectedAccount]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh balances
      await fetchBalances();
      
      // Update last sync time
      if (roundUpData) {
        setRoundUpData({
          ...roundUpData,
          lastSync: new Date().toLocaleDateString() + " – " + new Date().toLocaleTimeString().slice(0, 5)
        });
      }
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReviewRoundUp = () => {
    if (onReviewRoundUp) {
      onReviewRoundUp();
    } else {
      console.log("Navigate to round-up review");
    }
  };

  if (!isConnected || !selectedAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md coffee-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Coffee className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="coffee-text-primary">Welcome to Coffee Change</CardTitle>
            <CardDescription className="coffee-text-secondary">
              Connect your Solana wallet to start tracking your round-ups
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Please connect your wallet to access the dashboard
            </p>
            <div className="flex justify-center">
              <WalletConnectButton />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coffee className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold coffee-text-primary">Coffee Change</h1>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="coffee-button"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Syncing...' : 'Refresh'}
          </Button>
        </div>

        {/* Wallet Info Card */}
        <Card className="coffee-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Wallet Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium coffee-text-secondary">Address</span>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {selectedAccount.address.slice(0, 8)}...{selectedAccount.address.slice(-8)}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium coffee-text-secondary">Network</span>
              <Badge variant="secondary" className="coffee-bg-mocha text-white">
                {networkName}
              </Badge>
            </div>
            {(solBalance !== null || usdcBalance !== null) && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold coffee-text-primary">
                    {isLoadingBalances ? "..." : `${solBalance?.toFixed(4) || "0"} SOL`}
                  </div>
                  <div className="text-sm text-muted-foreground">Available Balance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold coffee-text-primary">
                    {isLoadingBalances ? "..." : `${usdcBalance?.toFixed(2) || "0"} USDC`}
                  </div>
                  <div className="text-sm text-muted-foreground">Stable Balance</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Tracking Card */}
        <Card className="coffee-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Last Scanned Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastTransaction ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium coffee-text-secondary">Transaction Hash</span>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {lastTransaction.hash}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium coffee-text-secondary">Amount</span>
                  <span className="text-sm font-medium">
                    {lastTransaction.amount} SOL
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium coffee-text-secondary">Scanned</span>
                  <span className="text-sm">{lastTransaction.timestamp}</span>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No transactions scanned yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Round-up Balance Card */}
        <Card className="coffee-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Round-up Balance
            </CardTitle>
            <CardDescription>
              Accumulated from your transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {roundUpData ? (
              <>
                <div className="text-center">
                  <div className="text-3xl font-bold coffee-text-primary">
                    ${roundUpData.totalUsd}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Round-up</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-semibold coffee-text-primary">
                      {roundUpData.solEquivalent} SOL
                    </div>
                    <div className="text-xs text-muted-foreground">SOL Equivalent</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-semibold coffee-text-primary">
                      ${roundUpData.usdcEquivalent} USDC
                    </div>
                    <div className="text-xs text-muted-foreground">USDC Equivalent</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Last sync: {roundUpData.lastSync}</span>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleReviewRoundUp}
                    className="w-full coffee-button"
                    size="lg"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Review & Confirm Transfer
                  </Button>
                  
                  {onViewPosition && (
                    <Button 
                      onClick={onViewPosition}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Investment Position
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Loading round-up data...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
