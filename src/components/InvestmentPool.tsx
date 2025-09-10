"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { aptos } from "@/lib/aptos";
import type { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { RWFI_ADDRESS } from "@/constants";

interface PoolData {
  remaining_tokens: number;
  funded_tokens: number;
  admin: string;
}

interface InvestorData {
  amount_tokens: number;
}

export function InvestmentPool() {
  const { account, signAndSubmitTransaction } = useWallet();
  const { toast } = useToast();
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [investorData, setInvestorData] = useState<InvestorData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [investAmount, setInvestAmount] = useState("");

  const loadPoolData = async () => {
    setIsLoading(true);
    try {
      // Try to get pool data
      const poolResult = await aptos.view({
        payload: {
          function: `${RWFI_ADDRESS}::spv::get_investment_pool`,
          functionArguments: [],
        },
      });
      setPoolData(poolResult[0] as PoolData);

      // Try to get investor data if connected
      if (account) {
        try {
          const investorResult = await aptos.view({
            payload: {
              function: `${RWFI_ADDRESS}::spv::get_investor`,
              functionArguments: [account.address.toString()],
            },
          });
          setInvestorData(investorResult[0] as InvestorData);
        } catch (error) {
          // Investor not found, that's okay
          setInvestorData(null);
        }
      }
    } catch (error) {
      console.error("Error loading pool data:", error);
      toast({
        title: "Error loading pool data",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPoolData();
  }, [account]);

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!investAmount || parseFloat(investAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid investment amount",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Convert amount to the smallest unit (assuming 8 decimals)
      const amountInUnits = Math.floor(parseFloat(investAmount) * 100000000);

      const transaction: InputTransactionData = {
        data: {
          function: `${RWFI_ADDRESS}::spv::invest_in_pool`,
          functionArguments: [amountInUnits],
        },
      };

      const response = await signAndSubmitTransaction(transaction);
      
      // Wait for transaction confirmation
      await aptos.waitForTransaction({ transactionHash: response.hash });

      toast({
        title: "Investment successful!",
        description: `Transaction hash: ${response.hash}`,
      });

      setInvestAmount("");
      await loadPoolData(); // Refresh data

    } catch (error) {
      console.error("Error investing:", error);
      toast({
        title: "Error making investment",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return (amount / 100000000).toFixed(8);
  };

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Connect Wallet to View Investment Pool
        </h2>
        <p className="text-gray-600">
          You need to connect your Aptos wallet to view and interact with the investment pool.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Investment Pool</h2>
          <p className="text-gray-600">
            Invest in the pool to fund invoices and earn returns
          </p>
        </div>
        <Button onClick={loadPoolData} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pool Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Pool Overview</CardTitle>
            <CardDescription>
              Current status of the investment pool
            </CardDescription>
          </CardHeader>
          <CardContent>
            {poolData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Available Balance:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatAmount(poolData.remaining_tokens)} APT
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Funded:</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {formatAmount(poolData.funded_tokens)} APT
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Pool Value:</span>
                  <span className="text-lg font-semibold text-purple-600">
                    {formatAmount(poolData.remaining_tokens + poolData.funded_tokens)} APT
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-sm text-gray-500">
                    Pool Admin: {poolData.admin.slice(0, 6)}...{poolData.admin.slice(-4)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading pool data...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Make Investment</CardTitle>
            <CardDescription>
              Invest APT tokens into the pool
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="investAmount">Investment Amount (APT)</Label>
                <Input
                  id="investAmount"
                  type="number"
                  step="0.00000001"
                  min="0"
                  placeholder="0.00"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500">
                  Amount of APT tokens to invest in the pool
                </p>
              </div>

              {investorData && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">
                    Your Current Investment
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatAmount(investorData.amount_tokens)} APT
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Invest in Pool"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Investment Benefits */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-2">💰</div>
              <h4 className="font-medium mb-1">Invest</h4>
              <p className="text-sm text-gray-600">
                Put your APT tokens into the investment pool
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📄</div>
              <h4 className="font-medium mb-1">Fund Invoices</h4>
              <p className="text-sm text-gray-600">
                Pool funds are used to finance real-world invoices
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📈</div>
              <h4 className="font-medium mb-1">Earn Returns</h4>
              <p className="text-sm text-gray-600">
                Receive returns when invoices are paid back
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
