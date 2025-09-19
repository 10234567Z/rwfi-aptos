"use client";

import { ContractDashboard } from "@/components/ContractDashboard";

export default function InvestorsPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Investor Dashboard
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Browse and invest in verified real-world asset opportunities with transparent returns.
          </p>
        </div>
        
        <ContractDashboard />
      </div>
    </div>
  );
}
