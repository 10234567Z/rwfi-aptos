"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { recordInvestment, RecordInvestmentArguments } from "@/entry-functions/spv";
import { 
  getInvestmentPool, 
  getInvestorInfo, 
  getInvestorCount, 
  investorExists,
  InvestmentPool,
  Investor 
} from "@/view-functions/getSPVData";

export function InvestmentPoolDashboard() {
  const { account, signAndSubmitTransaction } = useWallet();
  const { toast } = useToast();
  const [pool, setPool] = useState<InvestmentPool | null>(null);
  const [investorInfo, setInvestorInfo] = useState<Investor | null>(null);
  const [investorCount, setInvestorCount] = useState(0);
  const [isInvestor, setIsInvestor] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [investmentAmount, setInvestmentAmount] = useState("");

  useEffect(() => {
    fetchPoolData();
    if (account) {
      fetchInvestorData();
    }
  }, [account]);

  const fetchPoolData = async () => {
    try {
      const [poolData, count] = await Promise.all([
        getInvestmentPool(),
        getInvestorCount(),
      ]);
      
      setPool(poolData);
      setInvestorCount(count);
    } catch (error) {
      console.error("Error fetching pool data:", error);
    }
  };

  const fetchInvestorData = async () => {
    if (!account?.address) return;
    
    try {
      const [exists, info] = await Promise.all([
        investorExists(account.address),
        getInvestorInfo(account.address),
      ]);
      
      setIsInvestor(exists);
      setInvestorInfo(info);
    } catch (error) {
      console.error("Error fetching investor data:", error);
    }
  };

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account || !investmentAmount) {
      toast({
        title: "Error",
        description: "Please enter an investment amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const investArgs: RecordInvestmentArguments = {
        amount: parseInt(investmentAmount) * 100000000, // Convert to octas (8 decimals for APT)
      };

      const response = await signAndSubmitTransaction(recordInvestment(investArgs));
      
      toast({
        title: "Success",
        description: `Investment recorded! Transaction: ${response.hash}`,
      });
      
      // Reset form
      setInvestmentAmount("");
      
      // Refresh data
      await Promise.all([fetchPoolData(), fetchInvestorData()]);
      
    } catch (error) {
      console.error("Error recording investment:", error);
      toast({
        title: "Error",
        description: "Failed to record investment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAPT = (amount: number) => {
    return (amount / 100000000).toFixed(4); // Convert from octas
  };

  const getPoolUtilization = () => {
    if (!pool) return 0;
    const total = pool.remaining_tokens + pool.funded_tokens;
    return total > 0 ? (pool.funded_tokens / total) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      {/* Pool Overview */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-purple-600">💰</span>
            Investment Pool Overview
            <span className="text-sm font-normal text-gray-500">
              ({investorCount} investors)
            </span>
          </CardTitle>
          <p className="text-sm text-gray-600">Earn yields by funding invoice pools with predictable returns</p>
        </CardHeader>
        <CardContent>
          {pool ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatAPT(pool.remaining_tokens)} APT
                </p>
                <p className="text-sm text-gray-500">Available for Investment</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {formatAPT(pool.funded_tokens)} APT
                </p>
                <p className="text-sm text-gray-500">Currently Funding Invoices</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {getPoolUtilization().toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">Pool Utilization</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investment Form */}
      <Card>
        <CardHeader>
          <CardTitle>💎 Make Investment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvest} className="space-y-4">
            <div>
              <Label htmlFor="investment">Investment Amount (APT)</Label>
              <Input
                id="investment"
                type="number"
                step="0.0001"
                placeholder="100.0000"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum investment: 0.0001 APT
              </p>
            </div>
            <Button type="submit" disabled={loading || !account} className="w-full">
              {loading ? "Processing..." : "Invest in Pool"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Investor Dashboard */}
      {isInvestor && investorInfo && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Your Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Your Investment</p>
                  <p className="text-xl font-semibold">
                    {formatAPT(investorInfo.amount_tokens)} APT
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Estimated Annual Return</p>
                  <p className="text-lg font-semibold text-green-600">8-12%</p>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Your tokens are being used to fund invoice factoring</p>
                <p>• Returns are distributed when invoices are paid back</p>
                <p>• Typical yield ranges from 8-12% annually</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>ℹ️ How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <p>Invest APT tokens into the investment pool</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <p>Pool funds are used to purchase invoices from suppliers</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <p>When buyers pay invoices, you receive proportional returns</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <p>Earn yield from invoice factoring premiums (typically 8-12% annually)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
