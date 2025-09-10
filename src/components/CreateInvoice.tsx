"use client";

import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { aptos } from "@/lib/aptos";
import type { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { RWFI_ADDRESS } from "@/constants";

export function CreateInvoice() {
  const { account, signAndSubmitTransaction } = useWallet();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    dueDate: "",
    buyerInfo: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!formData.amount || !formData.dueDate || !formData.buyerInfo) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Convert amount to the smallest unit (assuming 8 decimals for simplicity)
      const amountInUnits = Math.floor(parseFloat(formData.amount) * 100000000);
      
      // Convert due date to timestamp
      const dueDateTimestamp = Math.floor(new Date(formData.dueDate).getTime() / 1000);
      
      // Convert buyer info to bytes
      const buyerInfoBytes = Array.from(new TextEncoder().encode(formData.buyerInfo));

      const transaction: InputTransactionData = {
        data: {
          function: `${RWFI_ADDRESS}::invoice_registery_simple::create_invoice_simple`,
          functionArguments: [
            amountInUnits,
            dueDateTimestamp,
            buyerInfoBytes,
          ],
        },
      };

      const response = await signAndSubmitTransaction(transaction);
      
      // Wait for transaction confirmation
      await aptos.waitForTransaction({ transactionHash: response.hash });

      toast({
        title: "Invoice created successfully!",
        description: `Transaction hash: ${response.hash}`,
      });

      // Reset form
      setFormData({
        amount: "",
        dueDate: "",
        buyerInfo: "",
      });

    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error creating invoice",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Connect Wallet to Create Invoice
        </h2>
        <p className="text-gray-600">
          You need to connect your Aptos wallet to create invoices.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Invoice</CardTitle>
          <CardDescription>
            Create an invoice that can be funded through the investment pool
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Invoice Amount (APT)</Label>
              <Input
                id="amount"
                type="number"
                step="0.00000001"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                required
              />
              <p className="text-sm text-gray-500">
                The total amount of the invoice in APT
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange("dueDate", e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              <p className="text-sm text-gray-500">
                When the invoice payment is due
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerInfo">Buyer Information</Label>
              <Input
                id="buyerInfo"
                type="text"
                placeholder="Enter buyer details..."
                value={formData.buyerInfo}
                onChange={(e) => handleInputChange("buyerInfo", e.target.value)}
                required
              />
              <p className="text-sm text-gray-500">
                Information about the buyer/debtor
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Creating Invoice..." : "Create Invoice"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
