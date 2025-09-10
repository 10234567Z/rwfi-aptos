"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { aptos } from "@/lib/aptos";
import { RWFI_ADDRESS } from "@/constants";

interface Invoice {
  supplier_addr: string;
  amount: number;
  due_date: number;
  buyer_data: {
    info: number[];
  };
  funded_amount: number;
}

export function InvoiceList() {
  const { account } = useWallet();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadInvoices = async () => {
    if (!account) return;
    
    setIsLoading(true);
    try {
      const result = await aptos.view({
        payload: {
          function: `${RWFI_ADDRESS}::invoice_registery_simple::get_invoices_simple`,
          functionArguments: [account.address.toString()],
        },
      });

      setInvoices(result[0] as Invoice[]);
    } catch (error) {
      console.error("Error loading invoices:", error);
      // Don't show error if registry doesn't exist yet (user has no invoices)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes("393221")) {
        toast({
          title: "Error loading invoices",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [account]);

  const formatAmount = (amount: number) => {
    return (amount / 100000000).toFixed(8);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatBuyerInfo = (infoBytes: number[]) => {
    try {
      return new TextDecoder().decode(new Uint8Array(infoBytes));
    } catch {
      return "Invalid buyer info";
    }
  };

  const calculateFundingPercentage = (funded: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((funded / total) * 100);
  };

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Connect Wallet to View Invoices
        </h2>
        <p className="text-gray-600">
          You need to connect your Aptos wallet to view your invoices.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Invoices</h2>
          <p className="text-gray-600">
            Manage your created invoices and track funding status
          </p>
        </div>
        <Button onClick={loadInvoices} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {isLoading && invoices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading invoices...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12">
          <Card>
            <CardHeader>
              <CardTitle>No Invoices Found</CardTitle>
              <CardDescription>
                You haven't created any invoices yet. Create your first invoice to get started!
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6">
          {invoices.map((invoice, index) => {
            const fundingPercentage = calculateFundingPercentage(
              invoice.funded_amount,
              invoice.amount
            );
            const isFullyFunded = fundingPercentage >= 100;

            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Invoice #{index + 1}
                      </CardTitle>
                      <CardDescription>
                        Created by you • Due: {formatDate(invoice.due_date)}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatAmount(invoice.amount)} APT
                      </div>
                      <div className={`text-sm font-medium ${
                        isFullyFunded ? "text-green-600" : "text-orange-600"
                      }`}>
                        {fundingPercentage}% Funded
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Buyer Information</h4>
                      <p className="text-gray-600 text-sm">
                        {formatBuyerInfo(invoice.buyer_data.info)}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Funding Details</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Amount:</span>
                          <span>{formatAmount(invoice.amount)} APT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Funded Amount:</span>
                          <span className="text-green-600">
                            {formatAmount(invoice.funded_amount)} APT
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Remaining:</span>
                          <span className="text-orange-600">
                            {formatAmount(invoice.amount - invoice.funded_amount)} APT
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Funding Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Funding Progress</span>
                      <span className="font-medium">{fundingPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isFullyFunded ? "bg-green-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
