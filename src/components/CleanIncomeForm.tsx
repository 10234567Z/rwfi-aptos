"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useInvoiceCreation } from "@/hooks/useContract";
import { useKYC } from "@/hooks/useKYC";
import { INCOME_TYPES, KYC_STATUS } from "@/utils/aptosClient";

interface CleanIncomeFormProps {
  onIncomeCreated?: () => void;
}

export function CleanIncomeForm({ onIncomeCreated }: CleanIncomeFormProps) {
  const { account } = useWallet();
  const { toast } = useToast();
  const { createInvoice, loading } = useInvoiceCreation();
  const { kycStatus } = useKYC();

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
        description: "Please connect your wallet to create accrued income",
        variant: "destructive",
      });
      return;
    }

    if (kycStatus !== KYC_STATUS.APPROVED) {
      toast({
        title: "KYC Verification Required",
        description: "Please complete and get approved for KYC verification before creating accrued income",
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
        description: "Accrued income amount must be greater than 0",
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
        description: "Income description is required",
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

      // Show initial loading toast
      toast({
        title: "Creating Income Record",
        description: "Please confirm the transaction in your wallet...",
      });

      await createInvoice(
        amountInOctas,
        dueDateTimestamp,
        parseInt(formData.incomeType),
        payerInfo,
        payerContact,
        formData.description
      );

      toast({
        title: "Accrued Income Created Successfully",
        description: `Accrued income for ${amount} APT has been created and submitted for funding review`,
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

      if (onIncomeCreated) {
        onIncomeCreated();
      }
    } catch (error) {
      toast({
        title: "Accrued Income Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create accrued income",
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
    <div className="bg-white text-black dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Create Accrued Income Entry
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Submit your accrued income for funding. You'll receive 90% of the amount immediately upon approval.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Income Details */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
              Income Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="amount" className="text-slate-700 dark:text-slate-300 text-base font-medium">
                  Income Amount (APT)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="1000.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  disabled={loading}
                  className="mt-2 h-12 text-base border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                {formData.amount && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">
                    You'll receive: {calculateFundingAmount(formData.amount).toFixed(2)} APT (90%)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="dueDate" className="text-slate-700 dark:text-slate-300 text-base font-medium">
                  Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange("dueDate", e.target.value)}
                  disabled={loading}
                  className="mt-2 h-12 text-base border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="incomeType" className="text-slate-700 dark:text-slate-300 text-base font-medium">
                  Income Type
                </Label>
                <select
                  id="incomeType"
                  value={formData.incomeType}
                  onChange={(e) => handleInputChange("incomeType", e.target.value)}
                  disabled={loading}
                  className="mt-2 w-full h-12 text-base bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-md px-3 focus:border-blue-500 focus:ring-blue-500"
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
                <Label htmlFor="description" className="text-slate-700 dark:text-slate-300 text-base font-medium">
                  Description
                </Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Project XYZ final payment"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  disabled={loading}
                  className="mt-2 h-12 text-base border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Payer Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
              Payer Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="payerName" className="text-slate-700 dark:text-slate-300 text-base font-medium">
                  Payer Name *
                </Label>
                <Input
                  id="payerName"
                  type="text"
                  placeholder="Company or Person Name"
                  value={formData.payerName}
                  onChange={(e) => handleInputChange("payerName", e.target.value)}
                  disabled={loading}
                  className="mt-2 h-12 text-base border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="payerEmail" className="text-slate-700 dark:text-slate-300 text-base font-medium">
                  Payer Email
                </Label>
                <Input
                  id="payerEmail"
                  type="email"
                  placeholder="payer@company.com"
                  value={formData.payerEmail}
                  onChange={(e) => handleInputChange("payerEmail", e.target.value)}
                  disabled={loading}
                  className="mt-2 h-12 text-base border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="payerPhone" className="text-slate-700 dark:text-slate-300 text-base font-medium">
                  Payer Phone
                </Label>
                <Input
                  id="payerPhone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.payerPhone}
                  onChange={(e) => handleInputChange("payerPhone", e.target.value)}
                  disabled={loading}
                  className="mt-2 h-12 text-base border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          {formData.amount && formData.dueDate && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Income Summary</h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-slate-600 dark:text-slate-400 text-sm">Income Amount</div>
                  <div className="text-slate-900 dark:text-white font-semibold text-lg">{formData.amount} APT</div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-400 text-sm">You'll Receive</div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-lg">
                    {calculateFundingAmount(formData.amount).toFixed(2)} APT
                  </div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-400 text-sm">Due Date</div>
                  <div className="text-slate-900 dark:text-white font-semibold">
                    {new Date(formData.dueDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-400 text-sm">Type</div>
                  <div className="text-slate-900 dark:text-white font-semibold">
                    {getIncomeTypeName(formData.incomeType)}
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 text-xl mr-3">💡</span>
                  <div>
                    <div className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                      Your income will be reviewed for funding approval based on your KYC verification. 
                      Approved entries receive 90% funding immediately.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button 
            type="submit"
            disabled={loading || kycStatus !== KYC_STATUS.APPROVED || !formData.amount || !formData.dueDate || !formData.payerName || !formData.description}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Income Entry..." : kycStatus !== KYC_STATUS.APPROVED ? "KYC Verification Required" : "Create Income Entry"}
          </Button>
        </form>
      </div>
    </div>
  );
}
