"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useInvoiceCreation } from "@/hooks/useContract";
import { INCOME_TYPES, INCOME_STATUS } from "@/utils/aptosClient";

interface Invoice {
  id: string;
  amount: string;
  due_date: number;
  income_type: number;
  payer_info: string;
  payer_contact: string;
  description: string;
  status: number;
  created_at: number;
  funded_amount?: string;
}

export function InvoiceManagement() {
  const { account } = useWallet();
  const { getSupplierInvoices } = useInvoiceCreation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: number) => {
    switch (status) {
      case INCOME_STATUS.PENDING: return "text-yellow-800";
      case INCOME_STATUS.FUNDED: return "text-green-800";
      case INCOME_STATUS.CANCELLED: return "text-red-800";
      case INCOME_STATUS.COLLECTED: return "text-purple-800";
      default: return "text-gray-800";
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case INCOME_STATUS.PENDING: return "Pending Review";
      case INCOME_STATUS.FUNDED: return "Funded";
      case INCOME_STATUS.CANCELLED: return "Cancelled";
      case INCOME_STATUS.COLLECTED: return "Collected";
      default: return "Unknown";
    }
  };

  const getIncomeTypeName = (type: number) => {
    const typeNames: Record<number, string> = {
      [INCOME_TYPES.SALARY]: "Salary",
      [INCOME_TYPES.SUBSCRIPTION]: "Subscription", 
      [INCOME_TYPES.FREELANCE]: "Freelance",
      [INCOME_TYPES.BUSINESS_INVOICE]: "Business Invoice",
      [INCOME_TYPES.OTHER]: "Other"
    };
    return typeNames[type] || "Unknown";
  };

  const formatAmount = (amount: string) => {
    return (parseInt(amount) / 100_000_000).toFixed(2);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatDaysUntilDue = (dueDate: number) => {
    const now = Math.floor(Date.now() / 1000);
    const daysUntilDue = Math.ceil((dueDate - now) / (24 * 60 * 60));
    
    if (daysUntilDue < 0) {
      return `${Math.abs(daysUntilDue)} days overdue`;
    } else if (daysUntilDue === 0) {
      return "Due today";
    } else {
      return `${daysUntilDue} days until due`;
    }
  };

  const parsePayer = (payerInfo: string) => {
    try {
      return JSON.parse(payerInfo);
    } catch {
      return { name: payerInfo };
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!account) return;
      setLoading(true);
      const res = await getSupplierInvoices(account.address?.toString());
      if (!mounted) return;
      setInvoices(res as Invoice[]);
      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [account?.address]);

  if (!account) {
    return (
      <Card className="bg-gray-200 border-gray-700 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">Connect your wallet to view your invoices</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-200 border-gray-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-black flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-900 rounded-lg flex items-center justify-center mr-3">
            📋
          </div>
          Your Invoices
        </CardTitle>
        <CardDescription className="text-gray-800">
          Manage and track your submitted invoices and their funding status
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-800">Loading your invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-800 mb-4">No invoices found</p>
            <p className="text-sm text-gray-900">Create your first invoice to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => {
              const payer = parsePayer(invoice.payer_info);
              const statusColor = getStatusColor(invoice.status);
              
              return (
                <div key={invoice.id} className="bg-gray-300 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-black font-semibold">{invoice.description}</h4>
                      <p className="text-gray-800 text-sm">
                        Invoice #{invoice.id} • {getIncomeTypeName(invoice.income_type)}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                      {getStatusText(invoice.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-800">Amount:</span>
                      <span className="ml-2 text-black font-semibold">
                        {formatAmount(invoice.amount)} APT
                      </span>
                      {invoice.funded_amount && (
                        <div className="text-green-800 text-xs">  
                          Funded: {formatAmount(invoice.funded_amount)} APT
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-gray-800">Due Date:</span>
                      <span className="ml-2 text-black">{formatDate(invoice.due_date)}</span>
                      <div className="text-yellow-800 text-xs">
                        {formatDaysUntilDue(invoice.due_date)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between items-center">
                    <div className="text-xs text-gray-900">
                      Created: {formatDate(invoice.created_at)}
                    </div>
                    
                    <div className="flex space-x-2">
                      {invoice.status === INCOME_STATUS.PENDING && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs bg-yellow-600/20 border-yellow-600 text-yellow-800 hover:bg-yellow-600/30"
                        >
                          Under Review
                        </Button>
                      )}
                      
                      {invoice.status === INCOME_STATUS.FUNDED && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs bg-blue-600/20 border-blue-600 text-blue-800 hover:bg-blue-600/30"
                        >
                          View Details
                        </Button>
                      )}
                      
                      {invoice.status === INCOME_STATUS.COLLECTED && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs bg-blue-600/20 border-blue-600 text-blue-800 hover:bg-blue-600/30"
                        >
                          Completed
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        {invoices.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="text-black font-semibold mb-3">Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-800/30 rounded p-3 text-center">
                <div className="text-black font-semibold">
                  {invoices.length}
                </div>
                <div className="text-gray-800 text-xs">Total Invoices</div>
              </div>
              

              <div className="bg-gray-800/30 rounded p-3 text-center">
                <div className="text-yellow-800 font-semibold">
                  {invoices.filter(inv => inv.status === INCOME_STATUS.PENDING).length}
                </div>
                <div className="text-gray-800 text-xs">Pending Review</div>
              </div>

              <div className="bg-gray-300 rounded p-3 text-center">
                <div className="text-blue-800 font-semibold">
                  {formatAmount(
                    invoices
                      .filter(inv => inv.status === INCOME_STATUS.PENDING)
                      .reduce((sum, inv) => sum + parseInt(inv.amount), 0)
                      .toString()
                  )} APT
                </div>
                <div className="text-gray-800 text-xs">Pending Value</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
