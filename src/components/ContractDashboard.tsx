"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";
import { 
  usePoolStats, 
  useInvestorInfo, 
  useCurrentEpoch,
  useInvestment,
  useWithdrawal
} from "@/hooks/useContract";

export function ContractDashboard() {
  const { account } = useWallet();
  const { toast } = useToast();
  const [investAmount, setInvestAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Contract hooks
  const { poolStats, loading: poolLoading, error: poolError, refetch: refetchPool } = usePoolStats();
  const { investorInfo, availableReturns, loading: investorLoading, refetch: refetchInvestor } = useInvestorInfo();
  const { currentEpoch, loading: epochLoading, refetch: refetchEpoch } = useCurrentEpoch();
  const { investApt, loading: investLoading } = useInvestment();
  const { withdrawReturns, loading: withdrawLoading } = useWithdrawal();

  const handleInvest = async () => {
    if (!investAmount || isNaN(Number(investAmount))) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid investment amount",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert to APT units (1 APT = 100,000,000 octas)
      const amountInOctas = (Number(investAmount) * 100_000_000).toString();
      
      await investApt(amountInOctas);
      
      toast({
        title: "Investment Successful",
        description: `Successfully invested ${investAmount} APT`,
      });
      
      setInvestAmount("");
      // Refresh data
      refetchPool();
      refetchInvestor();
    } catch (error) {
      toast({
        title: "Investment Failed",
        description: error instanceof Error ? error.message : "Failed to invest",
        variant: "destructive",
      });
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert to token units (assuming 1:1 with octas for simplicity)
      const amountInTokens = (Number(withdrawAmount) * 100_000_000).toString();
      
      await withdrawReturns(amountInTokens, true); // Use epoch-based withdrawal
      
      toast({
        title: "Withdrawal Successful",
        description: `Successfully withdrew ${withdrawAmount} tokens`,
      });
      
      setWithdrawAmount("");
      // Refresh data
      refetchPool();
      refetchInvestor();
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description: error instanceof Error ? error.message : "Failed to withdraw",
        variant: "destructive",
      });
    }
  };

  const formatAmount = (amount: string | null) => {
    if (!amount) return "0";
    // Convert from octas to APT for display
    return (Number(amount) / 100_000_000).toFixed(6);
  };

  if (!account) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contract Dashboard</CardTitle>
          <CardDescription>Connect your wallet to interact with the RWAfi protocol</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please connect your wallet to access the dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Epoch */}
      <Card>
        <CardHeader>
          <CardTitle>Current Epoch</CardTitle>
        </CardHeader>
        <CardContent>
          {epochLoading ? (
            <p>Loading...</p>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{currentEpoch || "0"}</span>
              <Button variant="outline" size="sm" onClick={refetchEpoch}>
                Refresh
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pool Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Pool Statistics</CardTitle>
          <CardDescription>Current state of the investment pool</CardDescription>
        </CardHeader>
        <CardContent>
          {poolLoading ? (
            <p>Loading pool statistics...</p>
          ) : poolError ? (
            <div className="text-red-500">
              <p>Error: {poolError}</p>
              <Button variant="outline" size="sm" onClick={refetchPool} className="mt-2">
                Retry
              </Button>
            </div>
          ) : poolStats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <p className="text-xl font-semibold">{formatAmount(poolStats.totalInvested)} APT</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Collections</p>
                <p className="text-xl font-semibold">{formatAmount(poolStats.totalCollections)} APT</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available for Funding</p>
                <p className="text-xl font-semibold">{formatAmount(poolStats.availableForFunding)} APT</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Funded Incomes</p>
                <p className="text-xl font-semibold">{formatAmount(poolStats.totalFundedIncomes)} APT</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reserved</p>
                <p className="text-xl font-semibold">{formatAmount(poolStats.reserved)} APT</p>
              </div>
              <div className="flex items-center">
                <Button variant="outline" size="sm" onClick={refetchPool}>
                  Refresh
                </Button>
              </div>
            </div>
          ) : (
            <p>No pool data available</p>
          )}
        </CardContent>
      </Card>

      {/* Investor Information */}
      <Card>
        <CardHeader>
          <CardTitle>Your Investment</CardTitle>
          <CardDescription>Your current position in the pool</CardDescription>
        </CardHeader>
        <CardContent>
          {investorLoading ? (
            <p>Loading investor information...</p>
          ) : (
            <div className="space-y-4">
              {investorInfo && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Join Epoch</p>
                    <p className="text-xl font-semibold">{investorInfo.joinEpoch}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Claim Epoch</p>
                    <p className="text-xl font-semibold">{investorInfo.lastClaimEpoch}</p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Available Returns</p>
                <p className="text-xl font-semibold">{formatAmount(availableReturns)} APT</p>
              </div>
              <Button variant="outline" size="sm" onClick={refetchInvestor}>
                Refresh
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investment Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Invest */}
        <Card>
          <CardHeader>
            <CardTitle>Invest APT</CardTitle>
            <CardDescription>Add liquidity to the investment pool</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="invest-amount">Amount (APT)</Label>
              <Input
                id="invest-amount"
                type="number"
                placeholder="0.0"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                disabled={investLoading}
              />
            </div>
            <Button 
              onClick={handleInvest} 
              disabled={investLoading || !investAmount}
              className="w-full"
            >
              {investLoading ? "Investing..." : "Invest APT"}
            </Button>
          </CardContent>
        </Card>

        {/* Withdraw */}
        <Card>
          <CardHeader>
            <CardTitle>Withdraw Returns</CardTitle>
            <CardDescription>Withdraw your earned returns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="withdraw-amount">Amount (Tokens)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="0.0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={withdrawLoading}
              />
            </div>
            <Button 
              onClick={handleWithdraw} 
              disabled={withdrawLoading || !withdrawAmount}
              className="w-full"
              variant="outline"
            >
              {withdrawLoading ? "Withdrawing..." : "Withdraw Returns"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
