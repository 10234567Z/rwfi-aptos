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
import { PoolStats } from "@/components/PoolStats";

export function ContractDashboard() {
  const { account } = useWallet();
  const { toast } = useToast();
  const [investAmount, setInvestAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Contract hooks
  const { investorInfo, availableReturns, aptBalance, loading: investorLoading, refetch: refetchInvestor } = useInvestorInfo();
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
      const amountInOctas = (Number(investAmount) * 100_000_000).toString();
      await investApt(amountInOctas);
      
      toast({
        title: "Investment Successful",
        description: `Successfully invested ${investAmount} APT`,
      });
      
      setInvestAmount("");
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
      const amountInTokens = (Number(withdrawAmount) * 100_000_000).toString();
      await withdrawReturns(amountInTokens, true);
      
      toast({
        title: "Withdrawal Successful",
        description: `Successfully withdrew ${withdrawAmount} tokens`,
      });
      
      setWithdrawAmount("");
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
    return (Number(amount) / 100_000_000).toFixed(6);
  };

  if (!account) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Contract Dashboard</CardTitle>
          <CardDescription className="text-gray-400">Connect your wallet to interact with the RWAfi protocol</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Please connect your wallet to access the dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Investment Dashboard
        </h2>
        <p className="text-gray-400">Manage your RWAfi investments and track returns</p>
      </div>

      {/* Pool Statistics */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Pool Statistics</h3>
        <PoolStats />
      </div>

      {/* Current Epoch */}
      <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Current Epoch</CardTitle>
        </CardHeader>
        <CardContent>
          {epochLoading ? (
            <p className="text-gray-400">Loading...</p>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">{currentEpoch || "0"}</span>
              <Button variant="outline" size="sm" onClick={refetchEpoch} className="border-gray-600 text-gray-300 bg-gray-800/50">
                Refresh
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your Portfolio */}
      <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Your Portfolio</CardTitle>
          <CardDescription className="text-gray-400">Your investment summary and available actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">APT Balance</p>
              <p className="text-2xl font-bold text-white">{formatAmount(aptBalance)} APT</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">INV Tokens</p>
              <p className="text-2xl font-bold text-blue-400">{formatAmount(investorInfo?.invTokens || "0")} INV</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Available Returns</p>
              <p className="text-2xl font-bold text-green-400">{formatAmount(availableReturns)} APT</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Invest */}
        <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Invest APT</CardTitle>
            <CardDescription className="text-gray-400">Add liquidity to the investment pool</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="invest-amount" className="text-gray-300">Amount (APT)</Label>
              <Input
                id="invest-amount"
                type="number"
                placeholder="0.0"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                disabled={investLoading}
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum investment: 1 APT
              </p>
            </div>
            <Button 
              onClick={handleInvest} 
              disabled={investLoading || !investAmount}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              {investLoading ? "Investing..." : "Invest APT"}
            </Button>
          </CardContent>
        </Card>

        {/* Withdraw */}
        <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Withdraw Returns</CardTitle>
            <CardDescription className="text-gray-400">Withdraw your investment and returns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="withdraw-amount" className="text-gray-300">Amount (Tokens)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="0.0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={withdrawLoading}
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available: {formatAmount(investorInfo?.invTokens || "0")} INV tokens
              </p>
            </div>
            <Button 
              onClick={handleWithdraw} 
              disabled={withdrawLoading || !withdrawAmount}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
            >
              {withdrawLoading ? "Withdrawing..." : "Withdraw Returns"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
