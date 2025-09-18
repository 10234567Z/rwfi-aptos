"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useInvoiceCreation } from "@/hooks/useContract";
import { INCOME_TYPES } from "@/utils/aptosClient";

interface InvoiceCreationFormProps {
  onInvoiceCreated?: () => void;
}

export function InvoiceCreationForm({ onInvoiceCreated }: InvoiceCreationFormProps) {
  const { account } = useWallet();
  const { toast } = useToast();
  const { createInvoice, loading } = useInvoiceCreation();

  const [formData, setFormData] = useState({
    amount: "",
    dueDate: "",
    incomeType: "4", // Default to BUSINESS_INVOICE
    payerName: "",
    payerEmail: "",
    payerPhone: "",
    description: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create an invoice",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    const dueDate = new Date(formData.dueDate);
    const now = new Date();

    // Validation
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Invoice amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (dueDate <= now) {
      toast({
        title: "Invalid Due Date",
        description: "Due date must be in the future",
        variant: "destructive",
      });
      return;
    }

    if (!formData.payerName.trim()) {
      toast({
        title: "Missing Payer Information",
        description: "Payer name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Missing Description",
        description: "Invoice description is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const amountInOctas = (amount * 100_000_000).toString();
      const dueDateTimestamp = Math.floor(dueDate.getTime() / 1000);
      
      const payerInfo = JSON.stringify({
        name: formData.payerName,
        email: formData.payerEmail,
        phone: formData.payerPhone
      });

      const payerContact = formData.payerEmail || formData.payerPhone || "No contact provided";

      await createInvoice(
        amountInOctas,
        dueDateTimestamp,
        parseInt(formData.incomeType),
        payerInfo,
        payerContact,
        formData.description
      );

      toast({
        title: "Invoice Created Successfully",
        description: `Invoice for ${amount} APT has been created and submitted for funding review`,
      });

      // Reset form
      setFormData({
        amount: "",
        dueDate: "",
        incomeType: "4",
        payerName: "",
        payerEmail: "",
        payerPhone: "",
        description: ""
      });

      if (onInvoiceCreated) {
        onInvoiceCreated();
      }
    } catch (error) {
      toast({
        title: "Invoice Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create invoice",
        variant: "destructive",
      });
    }
  };

  const getIncomeTypeName = (type: string) => {
    const typeNames = {
      "1": "Salary",
      "2": "Subscription",
      "3": "Freelance",
      "4": "Business Invoice",
      "5": "Other"
    };
    return typeNames[type as keyof typeof typeNames] || "Unknown";
  };

  const calculateFundingAmount = (amount: string) => {
    const amt = parseFloat(amount);
    return isNaN(amt) ? 0 : amt * 0.9; // 90% funding ratio
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
            📄
          </div>
          Create New Invoice
        </CardTitle>
        <CardDescription className="text-gray-400">
          Submit an invoice for funding. You'll receive 90% of the invoice amount immediately upon approval.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Details */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold">Invoice Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount" className="text-gray-300">Invoice Amount (APT)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="1000.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  disabled={loading}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-500"
                  required
                />
                {formData.amount && (
                  <p className="text-xs text-green-400 mt-1">
                    You'll receive: {calculateFundingAmount(formData.amount).toFixed(2)} APT (90%)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="dueDate" className="text-gray-300">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange("dueDate", e.target.value)}
                  disabled={loading}
                  className="bg-gray-800/50 border-gray-600 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="incomeType" className="text-gray-300">Income Type</Label>
                <select
                  id="incomeType"
                  value={formData.incomeType}
                  onChange={(e) => handleInputChange("incomeType", e.target.value)}
                  disabled={loading}
                  className="w-full bg-gray-800/50 border border-gray-600 text-white rounded-md px-3 py-2"
                  required
                >
                  {Object.entries(INCOME_TYPES).map(([name, value]) => (
                    <option key={value} value={value}>
                      {name.charAt(0) + name.slice(1).toLowerCase().replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Project XYZ final payment"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  disabled={loading}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Payer Information */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold">Payer Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="payerName" className="text-gray-300">Payer Name *</Label>
                <Input
                  id="payerName"
                  type="text"
                  placeholder="Company or Person Name"
                  value={formData.payerName}
                  onChange={(e) => handleInputChange("payerName", e.target.value)}
                  disabled={loading}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="payerEmail" className="text-gray-300">Payer Email</Label>
                <Input
                  id="payerEmail"
                  type="email"
                  placeholder="payer@company.com"
                  value={formData.payerEmail}
                  onChange={(e) => handleInputChange("payerEmail", e.target.value)}
                  disabled={loading}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-500"
                />
              </div>

              <div>
                <Label htmlFor="payerPhone" className="text-gray-300">Payer Phone</Label>
                <Input
                  id="payerPhone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.payerPhone}
                  onChange={(e) => handleInputChange("payerPhone", e.target.value)}
                  disabled={loading}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          {formData.amount && formData.dueDate && (
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Invoice Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Invoice Amount:</span>
                  <span className="ml-2 text-white font-semibold">{formData.amount} APT</span>
                </div>
                <div>
                  <span className="text-gray-400">You'll Receive:</span>
                  <span className="ml-2 text-green-400 font-semibold">
                    {calculateFundingAmount(formData.amount).toFixed(2)} APT
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Due Date:</span>
                  <span className="ml-2 text-white font-semibold">
                    {new Date(formData.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Type:</span>
                  <span className="ml-2 text-white font-semibold">
                    {getIncomeTypeName(formData.incomeType)}
                  </span>
                </div>
              </div>
              <div className="mt-3 p-3 bg-blue-900/20 rounded border border-blue-500/20">
                <p className="text-blue-400 text-xs">
                  💡 Your invoice will be reviewed for funding approval based on your risk assessment. 
                  Approved invoices receive 90% funding immediately.
                </p>
              </div>
            </div>
          )}

          <Button 
            type="submit"
            disabled={loading || !formData.amount || !formData.dueDate || !formData.payerName || !formData.description}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
          >
            {loading ? "Creating Invoice..." : "Create Invoice"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
