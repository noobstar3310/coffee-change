"use client";

import { useState } from "react";
import { useSolana } from "@/components/solana-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, DollarSign, Coffee, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface RoundUpReviewProps {
  onBack: () => void;
  onSuccess: () => void;
}

interface PaymentOption {
  id: 'sol' | 'usdc';
  label: string;
  amount: number;
  unit: string;
}

export function RoundUpReview({ onBack, onSuccess }: RoundUpReviewProps) {
  const { selectedAccount, isConnected } = useSolana();
  const [selectedPayment, setSelectedPayment] = useState<'sol' | 'usdc'>('sol');
  const [isProcessing, setIsProcessing] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string>('');

  // Mock data - replace with actual round-up data
  const roundUpAmount = 3.25;
  const solPrice = 180.50; // Mock SOL price
  const solEquivalent = roundUpAmount / solPrice;

  const paymentOptions: PaymentOption[] = [
    {
      id: 'sol',
      label: 'Pay via SOL',
      amount: solEquivalent,
      unit: 'SOL'
    },
    {
      id: 'usdc',
      label: 'Pay via USDC',
      amount: roundUpAmount,
      unit: 'USDC'
    }
  ];

  const handleConfirmTransfer = async () => {
    if (!isConnected || !selectedAccount) return;

    setIsProcessing(true);
    setTxStatus('pending');

    try {
      // Simulate transaction processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock successful transaction
      setTxHash('3Kj8...9Xm2');
      setTxStatus('success');
      
      // Navigate to success after a delay
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Transaction failed:', error);
      setTxStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isConnected || !selectedAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md coffee-card">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle className="coffee-text-primary">Wallet Not Connected</CardTitle>
            <CardDescription className="coffee-text-secondary">
              Please connect your wallet to review round-ups
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
      <div className="max-w-2xl mx-auto space-y-6">
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
            <h1 className="text-2xl font-bold coffee-text-primary">Review Round-up</h1>
          </div>
        </div>

        {/* Round-up Summary Card */}
        <Card className="coffee-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Round-up Summary
            </CardTitle>
            <CardDescription>
              Review your accumulated round-ups before transferring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold coffee-text-primary mb-2">
                ${roundUpAmount}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Round-up Amount
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-lg font-semibold coffee-text-primary">
                  {solEquivalent.toFixed(4)} SOL
                </div>
                <div className="text-xs text-muted-foreground">SOL Equivalent</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-lg font-semibold coffee-text-primary">
                  ${roundUpAmount} USDC
                </div>
                <div className="text-xs text-muted-foreground">USDC Equivalent</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Options Card */}
        <Card className="coffee-card">
          <CardHeader>
            <CardTitle>Select Payment Method</CardTitle>
            <CardDescription>
              Choose how you want to pay for the round-up transfer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentOptions.map((option) => (
              <div
                key={option.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedPayment === option.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedPayment(option.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">
                      Oracle conversion rate applied
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold coffee-text-primary">
                      {option.amount.toFixed(4)} {option.unit}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ≈ ${roundUpAmount}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Transaction Status */}
        {txStatus !== 'idle' && (
          <Card className="coffee-card">
            <CardContent className="pt-6">
              {txStatus === 'pending' && (
                <div className="flex items-center gap-3 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <div>
                    <div className="font-medium">Processing Transaction...</div>
                    <div className="text-sm text-muted-foreground">
                      Please confirm in your wallet
                    </div>
                  </div>
                </div>
              )}
              
              {txStatus === 'success' && (
                <div className="flex items-center gap-3 text-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <div className="font-medium text-green-700">Transfer Successful!</div>
                    <div className="text-sm text-muted-foreground">
                      Transaction: {txHash}
                    </div>
                  </div>
                </div>
              )}
              
              {txStatus === 'error' && (
                <div className="flex items-center gap-3 text-center">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                  <div>
                    <div className="font-medium text-destructive">Transaction Failed</div>
                    <div className="text-sm text-muted-foreground">
                      Please try again
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1"
            disabled={isProcessing}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleConfirmTransfer}
            disabled={isProcessing}
            className="flex-1 coffee-button"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Transfer
              </>
            )}
          </Button>
        </div>

        {/* Transaction Details */}
        <Card className="coffee-card">
          <CardHeader>
            <CardTitle className="text-sm">Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">From:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {selectedAccount.address.slice(0, 8)}...{selectedAccount.address.slice(-8)}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">To:</span>
              <span className="text-xs">Coffee Change Pool Contract</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network:</span>
              <Badge variant="secondary" className="coffee-bg-mocha text-white">
                Solana Devnet
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium">
                {selectedPayment === 'sol' 
                  ? `${solEquivalent.toFixed(4)} SOL`
                  : `${roundUpAmount} USDC`
                }
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

