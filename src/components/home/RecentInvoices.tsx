"use client";

import React, { useEffect, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useInvoiceCreation } from "@/hooks/useContract";

function decodeBytesToString(bytes: any) {
  try {
    if (!bytes) return "";
    const arr = Array.isArray(bytes) ? new Uint8Array(bytes) : new Uint8Array(bytes);
    return new TextDecoder().decode(arr);
  } catch (e) {
    return String(bytes);
  }
}

export function RecentInvoices() {
  const { account } = useWallet();
  const { getSupplierInvoices } = useInvoiceCreation();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!account?.address) return;
      setLoading(true);
      try {
        const list = await getSupplierInvoices(account.address.toString());
        setInvoices(list.slice(0, 6));
      } catch (e) {
        console.error("Failed to fetch supplier invoices:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [account?.address, getSupplierInvoices]);

  const panel = "bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6";

  return (
    <div className="space-y-4">
      <div className={panel}>
        <CardHeader>
          <CardTitle className="text-xl text-slate-900 dark:text-white">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : invoices.length === 0 ? (
            <div className="text-slate-500">No recent invoices</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invoices.map((inv: any, idx: number) => (
                <div key={idx} className="p-4 rounded-md bg-slate-50 dark:bg-slate-900">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm text-slate-500">Invoice #{inv.id}</div>
                      <div className="text-md font-semibold text-slate-900 dark:text-white">{inv.description || inv.payer_info || "Invoice"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-500 text-sm">Due</div>
                      <div className="font-semibold text-slate-900 dark:text-white">{new Date(Number(inv.due_date || 0) * 1000).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </div>
    </div>
  );
}
