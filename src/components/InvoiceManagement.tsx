"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { createInvoice, CreateInvoiceArguments } from "@/entry-functions/invoiceRegistry";
import { getInvoice, getInvoiceCount, Invoice } from "@/view-functions/getInvoiceData";
import { formatDistance } from "date-fns";

export function InvoiceManagement() {
  const { account, signAndSubmitTransaction } = useWallet();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [amount, setAmount] = useState("");
  const [dueDays, setDueDays] = useState("");
  const [buyerInfo, setBuyerInfo] = useState("");

  useEffect(() => {
    fetchInvoiceData();
  }, []);

  const fetchInvoiceData = async () => {
    try {
      const count = await getInvoiceCount();
      setInvoiceCount(count);
      
      // Fetch last 5 invoices
      const invoiceList: Invoice[] = [];
      const startId = Math.max(1, count - 4);
      
      for (let i = startId; i <= count; i++) {
        const invoice = await getInvoice(i);
        if (invoice) {
          invoiceList.push(invoice);
        }
      }
      
      setInvoices(invoiceList.reverse()); // Show newest first
    } catch (error) {
      console.error("Error fetching invoice data:", error);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account || !amount || !dueDays || !buyerInfo) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const dueDate = Math.floor(Date.now() / 1000) + parseInt(dueDays) * 24 * 60 * 60;
      
      const createInvoiceArgs: CreateInvoiceArguments = {
        amount: parseInt(amount) * 1000000, // Convert to micro units (6 decimals)
        due_date: dueDate,
        buyer_data_info: buyerInfo,
      };

      const response = await signAndSubmitTransaction(createInvoice(createInvoiceArgs));
      
      toast({
        title: "Success",
        description: `Invoice created! Transaction: ${response.hash}`,
      });
      
      // Reset form
      setAmount("");
      setDueDays("");
      setBuyerInfo("");
      
      // Refresh data
      await fetchInvoiceData();
      
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return (amount / 1000000).toFixed(2); // Convert from micro units
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return "Pending";
      case 1: return "Funded";
      case 2: return "Paid";
      default: return "Unknown";
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return "text-yellow-600";
      case 1: return "text-blue-600";
      case 2: return "text-green-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-green-600">📄</span>
            Invoice Management
            <span className="text-sm font-normal text-gray-500">
              ({invoiceCount} total invoices)
            </span>
          </CardTitle>
          <p className="text-sm text-gray-600">Create invoices and get immediate funding up to 95% of their value</p>
        </CardHeader>
        <CardContent className="bg-white rounded-lg p-6">
          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="amount" className="text-gray-700 font-medium">Amount (APT)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="1000.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dueDays" className="text-gray-700 font-medium">Due in (days)</Label>
                <Input
                  id="dueDays"
                  type="number"
                  placeholder="30"
                  value={dueDays}
                  onChange={(e) => setDueDays(e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="buyerInfo" className="text-gray-700 font-medium">Buyer Information</Label>
                <Input
                  id="buyerInfo"
                  placeholder="Company ABC - Invoice #12345"
                  value={buyerInfo}
                  onChange={(e) => setBuyerInfo(e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={loading || !account}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-2"
            >
              {loading ? "Creating..." : "Create Invoice & Get Funded"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No invoices found. Create your first invoice above!
            </p>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Invoice #{invoice.id}</span>
                        <span className={`text-sm font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusText(invoice.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{invoice.buyer_data_info}</p>
                      <p className="text-sm text-gray-500">
                        Due: {formatDistance(new Date(invoice.due_date * 1000), new Date(), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{formatAmount(invoice.amount)} APT</p>
                      <p className="text-xs text-gray-500 truncate max-w-32">
                        {invoice.supplier_addr}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
