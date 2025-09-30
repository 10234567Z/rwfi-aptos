"use client";

import React from "react";

export const InvestorFlow: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
      <h3 className="text-2xl font-semibold mb-4 text-black">How Investors Earn 10% Fixed Yield</h3>

      <div className="flex flex-col md:flex-row items-center justify-center gap-6">
        {/* Step 1: Invest */}
        <div className="flex-1 flex flex-col items-center text-center">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
            Invest
          </div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">You deposit funds into the investment pool.</p>
        </div>

        {/* Arrow */}
        <div className="hidden md:block w-12 flex-shrink-0">
          <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
            <g>
              <path d="M0 20 L80 20" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M78 12 L98 20 L78 28" fill="#3b82f6" />
            </g>
          </svg>
        </div>
        

        {/* Step 2: Pool allocates to invoices */}
        <div className="flex-1 flex flex-col items-center text-center">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
            Fund
          </div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Pool funds are used to purchase supplier invoices (factoring).</p>
        </div>

        {/* Arrow */}
        <div className="hidden md:block w-12 flex-shrink-0">
          <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
            <g>
              <path d="M0 20 L80 20" stroke="#10b981" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M78 12 L98 20 L78 28" fill="#10b981" />
            </g>
          </svg>
        </div>

        {/* Step 3: Buyer pays on due date */}
        <div className="flex-1 flex flex-col items-center text-center">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold shadow-lg">
            Buyer Pays
          </div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">On the invoice due date the buyer pays the invoice amount to the treasury.</p>
        </div>

        {/* Arrow */}
        <div className="hidden md:block w-12 flex-shrink-0">
          <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
            <g>
              <path d="M0 20 L80 20" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M78 12 L98 20 L78 28" fill="#f59e0b" />
            </g>
          </svg>
        </div>

        {/* Step 4: Investors receive fixed yield */}
        <div className="flex-1 flex flex-col items-center text-center">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
            10% Yield
          </div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Buyer's payout triggers distributions: investors receive a fixed 10% yield (principal + yield routed according to pool rules).</p>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        <ul className="list-disc list-inside space-y-2">
          <li>Investors lock capital into the pool; capital is allocated to approved supplier invoices.</li>
          <li>On the invoice due date, buyer payments replenish the treasury/pool.</li>
          <li>From the buyer payout, the protocol pays investors a fixed 10% yield.</li>
          <li>Any remaining funds follow the pool's settlement rules (reserves, fees, principal returns).</li>
        </ul>
      </div>
    </div>
  );
};

export default InvestorFlow;
