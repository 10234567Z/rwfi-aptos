"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { 
  fundInvoice, 
  FundInvoiceArguments,
  distributeYield,
  DistributeYieldArguments,
  recordInvoicePending,
  RecordInvoicePendingArguments 
} from "@/entry-functions/spv";
import { 
  mintInvoiceCoin, 
  MintInvoiceCoinArguments,
  burnInvoiceCoin,
  BurnInvoiceCoinArguments,
  mintInvoiceCoinToSPV,
  MintToSPVArguments
} from "@/entry-functions/invoiceCoin";
import { RWFI_ADDRESS, ADMIN_ADDRESSES, isAdminAddress } from "@/constants";

export function AdminPanel() {
  const { account, signAndSubmitTransaction } = useWallet();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Form states
  const [invoiceId, setInvoiceId] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [supplierAddr, setSupplierAddr] = useState("");
  const [yieldAmount, setYieldAmount] = useState("");
  const [yieldPercentage, setYieldPercentage] = useState("");
  const [mintTo, setMintTo] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [spvMintAmount, setSpvMintAmount] = useState("");

  useEffect(() => {
    // Check if current user is admin
    if (isAdminAddress(account?.address?.toString())) {
      setIsAdmin(true);
    }
  }, [account]);

  const handleRecordInvoicePending = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId) return;

    setLoading(true);
    try {
      const args: RecordInvoicePendingArguments = {
        invoice_id: parseInt(invoiceId),
      };

      const response = await signAndSubmitTransaction(recordInvoicePending(args));
      toast({
        title: "Success",
        description: `Invoice marked as pending! Transaction: ${response.hash}`,
      });
      setInvoiceId("");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to record invoice as pending",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFundInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId || !fundAmount || !supplierAddr) return;

    setLoading(true);
    try {
      const args: FundInvoiceArguments = {
        invoice_id: parseInt(invoiceId),
        required_amount: parseInt(fundAmount) * 1000000, // Convert to micro units
        supplier_addr: supplierAddr,
      };

      const response = await signAndSubmitTransaction(fundInvoice(args));
      toast({
        title: "Success",
        description: `Invoice funded! Transaction: ${response.hash}`,
      });
      setInvoiceId("");
      setFundAmount("");
      setSupplierAddr("");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to fund invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDistributeYield = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId || !yieldAmount || !yieldPercentage) return;

    setLoading(true);
    try {
      const args: DistributeYieldArguments = {
        invoice_id: parseInt(invoiceId),
        total_payback_amount: parseInt(yieldAmount) * 1000000, // Convert to micro units
        yield_percentage: parseInt(yieldPercentage),
      };

      const response = await signAndSubmitTransaction(distributeYield(args));
      toast({
        title: "Success",
        description: `Yield distributed! Transaction: ${response.hash}`,
      });
      setInvoiceId("");
      setYieldAmount("");
      setYieldPercentage("");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to distribute yield",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMintCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mintTo || !mintAmount) return;

    setLoading(true);
    try {
      const args: MintInvoiceCoinArguments = {
        to: mintTo,
        amount: parseInt(mintAmount) * 1000000, // Convert to micro units
      };

      const response = await signAndSubmitTransaction(mintInvoiceCoin(args));
      toast({
        title: "Success",
        description: `Invoice coins minted! Transaction: ${response.hash}`,
      });
      setMintTo("");
      setMintAmount("");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to mint invoice coins",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMintToSPV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spvMintAmount) return;

    setLoading(true);
    try {
      const args: MintToSPVArguments = {
        amount: parseInt(spvMintAmount) * 1000000, // Convert to micro units
      };

      const response = await signAndSubmitTransaction(mintInvoiceCoinToSPV(args));
      toast({
        title: "Success",
        description: `${spvMintAmount} invoice coins minted to SPV! Transaction: ${response.hash}`,
      });
      setSpvMintAmount("");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to mint coins to SPV",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🔒 Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">
            Admin access required. Only authorized administrators can access this panel.
          </p>
          <p className="text-center text-sm text-gray-400 mt-2">
            Current account: {account?.address?.toString() || "Not connected"}
          </p>
          <div className="text-center text-sm text-gray-400 mt-2">
            <p className="font-medium">Authorized admin accounts:</p>
            {ADMIN_ADDRESSES.map((addr, index) => (
              <p key={addr} className="font-mono text-xs mt-1">
                {index === 0 ? "Contract Deployer: " : `Admin ${index}: `}{addr}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Admin Panel</CardTitle>
          <p className="text-sm text-green-600">
            Admin access confirmed ({ADMIN_ADDRESSES.findIndex(addr => addr === account?.address?.toString()) === 0 ? "Contract Deployer" : "Authorized Admin"})
          </p>
        </CardHeader>
      </Card>

      {/* Record Invoice Pending */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Record Invoice as Pending</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRecordInvoicePending} className="space-y-4">
            <div>
              <Label htmlFor="pendingInvoiceId">Invoice ID</Label>
              <Input
                id="pendingInvoiceId"
                type="number"
                placeholder="1"
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Record as Pending"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Fund Invoice */}
      <Card>
        <CardHeader>
          <CardTitle>💰 Fund Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFundInvoice} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="fundInvoiceId">Invoice ID</Label>
                <Input
                  id="fundInvoiceId"
                  type="number"
                  placeholder="1"
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="fundAmount">Amount (APT)</Label>
                <Input
                  id="fundAmount"
                  type="number"
                  step="0.01"
                  placeholder="1000.00"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="supplierAddr">Supplier Address</Label>
                <Input
                  id="supplierAddr"
                  placeholder="0x..."
                  value={supplierAddr}
                  onChange={(e) => setSupplierAddr(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Fund Invoice"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Distribute Yield */}
      <Card>
        <CardHeader>
          <CardTitle>📈 Distribute Yield</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDistributeYield} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="yieldInvoiceId">Invoice ID</Label>
                <Input
                  id="yieldInvoiceId"
                  type="number"
                  placeholder="1"
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="yieldAmount">Total Payback (APT)</Label>
                <Input
                  id="yieldAmount"
                  type="number"
                  step="0.01"
                  placeholder="1200.00"
                  value={yieldAmount}
                  onChange={(e) => setYieldAmount(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="yieldPercentage">Yield %</Label>
                <Input
                  id="yieldPercentage"
                  type="number"
                  placeholder="20"
                  value={yieldPercentage}
                  onChange={(e) => setYieldPercentage(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Distribute Yield"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Mint Invoice Coins to SPV */}
      <Card>
        <CardHeader>
          <CardTitle>🏦 Mint Initial Tokens to SPV</CardTitle>
          <p className="text-sm text-gray-600">Mint invoice coins directly to the SPV contract for operations</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleMintToSPV} className="space-y-4">
            <div>
              <Label htmlFor="spvMintAmount">Amount (Invoice Coins)</Label>
              <Input
                id="spvMintAmount"
                type="number"
                step="0.01"
                placeholder="1000.00"
                value={spvMintAmount}
                onChange={(e) => setSpvMintAmount(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Mints to: {RWFI_ADDRESS}
              </p>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Processing..." : "Mint Coins to SPV"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Mint Invoice Coins */}
      <Card>
        <CardHeader>
          <CardTitle>🪙 Mint Invoice Coins</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleMintCoins} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mintTo">Mint To Address</Label>
                <Input
                  id="mintTo"
                  placeholder="0x..."
                  value={mintTo}
                  onChange={(e) => setMintTo(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="mintAmount">Amount</Label>
                <Input
                  id="mintAmount"
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Mint Coins"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Admin Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Admin Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <p>When suppliers create invoices, record them as pending for funding</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <p>Fund invoices when sufficient investment pool balance is available</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <p>When buyers pay invoices, distribute yields to investors proportionally</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <p>Mint invoice coins as needed for payments and transfers</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
