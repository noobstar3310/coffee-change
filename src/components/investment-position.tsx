"use client";

import { useState } from "react";
import { useSolana } from "@/components/solana-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, DollarSign, Coffee, PieChart, Clock, AlertCircle } from "lucide-react";

interface InvestmentPositionProps {
  onBack: () => void;
}

interface PoolData {
  totalValue: number;
  userShare: number;
  userDeposits: number;
  totalDeposits: number;
  poolSize: number;
  lastContribution: string;
  historicalContributions: number;
}

export function InvestmentPosition({ onBack }: InvestmentPositionProps) {
  const { selectedAccount, isConnected } = useSolana();
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with actual smart contract data
  useState(() => {
    if (isConnected && selectedAccount) {
      // Simulate loading
      setTimeout(() => {
        setPoolData({
          totalValue: 1250.75,
          userShare: 0.15, // 15%
          userDeposits: 187.50,
          totalDeposits: 1250.75,
          poolSize: 1250.75,
          lastContribution: "12/15/2024",
          historicalContributions: 8
        });
        setIsLoading(false);
      }, 1000);
    }
  });

  if (!isConnected || !selectedAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md coffee-card">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle className="coffee-text-primary">Wallet Not Connected</CardTitle>
            <CardDescription className="coffee-text-secondary">
              Please connect your wallet to view investment positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onBack} className="w-full coffee-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md coffee-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span>Loading investment data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!poolData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md coffee-card">
          <CardHeader className="text-center">
            <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="coffee-text-primary">No Investment Position</CardTitle>
            <CardDescription className="coffee-text-secondary">
              You haven&apos;t made any round-up transfers yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onBack} className="w-full coffee-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Coffee className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold coffee-text-primary">Investment Position</h1>
          </div>
        </div>

        {/* Portfolio Overview Card */}
        <Card className="coffee-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Portfolio Overview
            </CardTitle>
            <CardDescription>
              Your current position in the Coffee Change investment pool
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold coffee-text-primary mb-2">
                  ${poolData.totalValue.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Total Pool Value</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold coffee-text-primary mb-2">
                  {(poolData.userShare * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Your Share</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold coffee-text-primary mb-2">
                  ${poolData.userDeposits.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Your Deposits</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investment Details Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Your Position Card */}
          <Card className="coffee-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Your Position
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium coffee-text-secondary">Pool Share</span>
                <span className="font-semibold">{(poolData.userShare * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium coffee-text-secondary">Total Deposited</span>
                <span className="font-semibold">${poolData.userDeposits.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium coffee-text-secondary">Contributions</span>
                <span className="font-semibold">{poolData.historicalContributions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium coffee-text-secondary">Last Contribution</span>
                <span className="font-semibold">{poolData.lastContribution}</span>
              </div>
            </CardContent>
          </Card>

          {/* Pool Statistics Card */}
          <Card className="coffee-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pool Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium coffee-text-secondary">Pool Size</span>
                <span className="font-semibold">${poolData.poolSize.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium coffee-text-secondary">Total Deposits</span>
                <span className="font-semibold">${poolData.totalDeposits.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium coffee-text-secondary">Network</span>
                <Badge variant="secondary" className="coffee-bg-mocha text-white">
                  Solana Devnet
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium coffee-text-secondary">Status</span>
                <Badge variant="default" className="bg-green-500 text-white">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart Placeholder */}
        <Card className="coffee-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Overview
            </CardTitle>
            <CardDescription>
              Your investment performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Performance chart coming soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button
            disabled
            className="w-full coffee-button"
          >
            <Clock className="w-4 h-4 mr-2" />
            Withdraw / Reinvest (Coming Soon)
          </Button>
        </div>

        {/* Transaction History Placeholder */}
        <Card className="coffee-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Transaction History
            </CardTitle>
            <CardDescription>
              Your round-up transfer history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div>
                      <div className="text-sm font-medium">Round-up Transfer #{index + 1}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold coffee-text-primary">
                      +${(Math.random() * 5 + 1).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">Deposited</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

