"use client";

import React from "react";
import { usePoolStats } from "@/hooks/useContract";

export function InvestorExtras() {
  const { poolStats, loading } = usePoolStats();

  const formatAPT = (octas?: string) => {
    if (!octas) return "0";
    try {
      const n = BigInt(octas);
      const apt = Number(n) / 100_000_000;
      return apt.toLocaleString(undefined, { maximumFractionDigits: 2 });
    } catch (e) {
      return octas.toString();
    }
  };

  return (
    <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-slate-500">Total Invested</div>
          <div className="text-lg font-semibold text-slate-900 dark:text-white">{loading ? "..." : `${formatAPT(poolStats?.totalInvested)} APT`}</div>
        </div>

        <div>
          <div className="text-sm text-slate-500">Available for Funding</div>
          <div className="text-lg font-semibold text-slate-900 dark:text-white">{loading ? "..." : `${formatAPT(poolStats?.availableForFunding)} APT`}</div>
        </div>
      </div>
    </div>
  );
}
