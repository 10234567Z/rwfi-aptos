"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePoolStats } from "@/hooks/useContract";

export function KPIGrid() {
  const { poolStats, loading } = usePoolStats();

  const panel = "bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6";

  const formatAPT = (octas?: string) => {
    if (!octas) return "0";
    try {
      const n = BigInt(octas);
      // display APT with 2 decimals
      const apt = Number(n) / 100_000_000;
      return apt.toLocaleString(undefined, { maximumFractionDigits: 2 });
    } catch (e) {
      return octas.toString();
    }
  };

  return (
    <div className="space-y-6">
      <div className={panel}>
        <CardHeader>
          <CardTitle className="text-xl text-slate-900 dark:text-white">Platform KPIs</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-900">
            <div className="text-sm text-slate-500">Total Invested</div>
            <div className="text-2xl font-semibold mt-2 text-slate-900 dark:text-white">{loading ? "..." : formatAPT(poolStats?.totalInvested)}</div>
          </div>

          <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-900">
            <div className="text-sm text-slate-500">Available for Funding</div>
            <div className="text-2xl font-semibold mt-2 text-slate-900 dark:text-white">{loading ? "..." : formatAPT(poolStats?.availableForFunding)}</div>
          </div>

          <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-900">
            <div className="text-sm text-slate-500">Total Funded Incomes</div>
            <div className="text-2xl font-semibold mt-2 text-slate-900 dark:text-white">{loading ? "..." : poolStats?.totalFundedIncomes || "0"}</div>
          </div>

          <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-900">
            <div className="text-sm text-slate-500">Total Collections (from buyer)</div>
            <div className="text-2xl font-semibold mt-2 text-slate-900 dark:text-white">{loading ? "..." : formatAPT(poolStats?.totalCollections)}</div>
          </div>
        </CardContent>
      </div>
    </div>
  );
}
