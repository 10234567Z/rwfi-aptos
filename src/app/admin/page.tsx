"use client";

import { useState, useEffect } from "react";
import { AdminKYCDashboard } from "@/components/AdminKYCDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { 
  useAdminFunding, 
  useAdminKYC, 
  useAdminCollection, 
  useTreasuryAddress,
  usePoolStats
} from "@/hooks/useContract";
import { Copy } from "lucide-react";

export default function AdminPage() {
  const { toast } = useToast();
  const { poolStats, refetch: refetchPoolStats } = usePoolStats();
  const { treasuryAddress, loading: treasuryLoading } = useTreasuryAddress();
  const { fundAccruedIncome, loading: fundingLoading } = useAdminFunding();
  const { processKYCApplication, getPendingKYCSuppliers, loading: kycLoading } = useAdminKYC();
  const { recordIncomeCollection, loading: collectionLoading } = useAdminCollection();

  // KYC Form State
  const [kycSupplierAddress, setKycSupplierAddress] = useState("");
  const [pendingKYCCount, setPendingKYCCount] = useState(0);

  // Funding Form State
  const [fundSupplierAddress, setFundSupplierAddress] = useState("");
  const [fundIncomeId, setFundIncomeId] = useState("");

  // Collection Form State
  const [collectionFundedId, setCollectionFundedId] = useState("");
  const [collectionAmount, setCollectionAmount] = useState("");

  useEffect(() => {
    const fetchPendingKYC = async () => {
      const pending = await getPendingKYCSuppliers();
      setPendingKYCCount(pending.length);
    };
    fetchPendingKYC();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Address copied to clipboard" });
  };

  const formatAPT = (octas?: string) => {
    if (!octas) return "0.00";
    return (Number(octas) / 100_000_000).toFixed(2);
  };

  // KYC Handlers
  const handleProcessKYC = async (approved: boolean) => {
    if (!kycSupplierAddress) {
      toast({ title: "Error", description: "Enter supplier address", variant: "destructive" });
      return;
    }

    try {
      await processKYCApplication(kycSupplierAddress, approved);
      toast({ 
        title: "Success", 
        description: `KYC ${approved ? "approved" : "rejected"} for ${kycSupplierAddress.slice(0, 8)}...` 
      });
      setKycSupplierAddress("");
      const pending = await getPendingKYCSuppliers();
      setPendingKYCCount(pending.length);
    } catch (error) {
      toast({ 
        title: "Failed", 
        description: error instanceof Error ? error.message : "KYC processing failed", 
        variant: "destructive" 
      });
    }
  };

  // Funding Handler
  const handleFundIncome = async () => {
    if (!fundSupplierAddress || !fundIncomeId) {
      toast({ title: "Error", description: "Enter both supplier address and income ID", variant: "destructive" });
      return;
    }

    try {
      await fundAccruedIncome(fundSupplierAddress, fundIncomeId);
      toast({ 
        title: "Success", 
        description: `Funded income #${fundIncomeId} for supplier ${fundSupplierAddress.slice(0, 8)}...` 
      });
      setFundSupplierAddress("");
      setFundIncomeId("");
      refetchPoolStats();
    } catch (error) {
      toast({ 
        title: "Failed", 
        description: error instanceof Error ? error.message : "Funding failed", 
        variant: "destructive" 
      });
    }
  };

  // Collection Handler
  const handleRecordCollection = async () => {
    if (!collectionFundedId || !collectionAmount) {
      toast({ title: "Error", description: "Enter both funded ID and collection amount", variant: "destructive" });
      return;
    }

    try {
      const amountInOctas = (Number(collectionAmount) * 100_000_000).toString();
      await recordIncomeCollection(collectionFundedId, amountInOctas);
      toast({ 
        title: "Success", 
        description: `Recorded ${collectionAmount} APT collection for funded income #${collectionFundedId}` 
      });
      setCollectionFundedId("");
      setCollectionAmount("");
      refetchPoolStats();
    } catch (error) {
      toast({ 
        title: "Failed", 
        description: error instanceof Error ? error.message : "Collection recording failed", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Manage KYC, funding, and collections
          </p>
        </div>

        {/* Treasury & Pool Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Treasury Address</CardTitle>
            </CardHeader>
            <CardContent>
              {treasuryLoading ? (
                <p className="text-gray-400">Loading...</p>
              ) : (
                <div className="flex items-center gap-2">
                  <code className="text-sm text-green-400 bg-gray-800 px-3 py-2 rounded flex-1 overflow-x-auto">
                    {treasuryAddress || "Not found"}
                  </code>
                  {treasuryAddress && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => copyToClipboard(treasuryAddress)}
                      className="border-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Pool Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Invested:</span>
                <span className="text-white font-semibold">{formatAPT(poolStats?.totalInvested)} APT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Funded:</span>
                <span className="text-white font-semibold">{formatAPT(poolStats?.totalFundedAmount)} APT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Collections:</span>
                <span className="text-white font-semibold">{formatAPT(poolStats?.totalCollections)} APT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Available to Fund:</span>
                <span className="text-white font-semibold">{formatAPT(poolStats?.availableForFunding)} APT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Withdrawal Gate:</span>
                <span className={poolStats?.fullWithdrawalEnabled ? "text-green-400" : "text-yellow-400"}>
                  {poolStats?.fullWithdrawalEnabled ? "OPEN" : "LOCKED"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* KYC Processing */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Process KYC</CardTitle>
              <CardDescription className="text-gray-400">
                Pending: {pendingKYCCount}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="kyc-address" className="text-gray-300">Supplier Address</Label>
                <Input
                  id="kyc-address"
                  value={kycSupplierAddress}
                  onChange={(e) => setKycSupplierAddress(e.target.value)}
                  placeholder="0x..."
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleProcessKYC(true)}
                  disabled={kycLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => handleProcessKYC(false)}
                  disabled={kycLoading}
                  variant="destructive"
                  className="flex-1"
                >
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Fund Income */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Fund Income</CardTitle>
              <CardDescription className="text-gray-400">
                Deploy capital to supplier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fund-address" className="text-gray-300">Supplier Address</Label>
                <Input
                  id="fund-address"
                  value={fundSupplierAddress}
                  onChange={(e) => setFundSupplierAddress(e.target.value)}
                  placeholder="0x..."
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="fund-id" className="text-gray-300">Income ID</Label>
                <Input
                  id="fund-id"
                  type="number"
                  value={fundIncomeId}
                  onChange={(e) => setFundIncomeId(e.target.value)}
                  placeholder="0"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <Button
                onClick={handleFundIncome}
                disabled={fundingLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {fundingLoading ? "Funding..." : "Fund Income"}
              </Button>
            </CardContent>
          </Card>

          {/* Record Collection */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Record Collection</CardTitle>
              <CardDescription className="text-gray-400">
                Log buyer payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="collection-id" className="text-gray-300">Funded Income ID</Label>
                <Input
                  id="collection-id"
                  type="number"
                  value={collectionFundedId}
                  onChange={(e) => setCollectionFundedId(e.target.value)}
                  placeholder="0"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="collection-amount" className="text-gray-300">Amount (APT)</Label>
                <Input
                  id="collection-amount"
                  type="number"
                  value={collectionAmount}
                  onChange={(e) => setCollectionAmount(e.target.value)}
                  placeholder="0.0"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <Button
                onClick={handleRecordCollection}
                disabled={collectionLoading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {collectionLoading ? "Recording..." : "Record Collection"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* KYC Dashboard */}
        <AdminKYCDashboard />
      </div>
    </div>
  );
}
