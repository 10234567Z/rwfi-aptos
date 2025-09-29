"use client";

import React from "react";

export function ProcessSteps() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg bg-blue-500 shadow-lg">1</div>
          <span className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">Upload KYC</span>
        </div>

        <div className="flex-1 h-0.5 mx-6 bg-slate-200 dark:bg-slate-700" />

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg bg-amber-500 shadow-lg">2</div>
          <span className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">Create Invoice</span>
        </div>

        <div className="flex-1 h-0.5 mx-6 bg-slate-200 dark:bg-slate-700" />

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg bg-emerald-500 shadow-lg">3</div>
          <span className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">Get Funded</span>
        </div>

        <div className="flex-1 h-0.5 mx-6 bg-slate-200 dark:bg-slate-700" />

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg bg-purple-600 shadow-lg">4</div>
          <span className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">Repay</span>
        </div>
      </div>
    </div>
  );
}
