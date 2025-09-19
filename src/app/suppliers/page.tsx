"use client";

import { CleanSupplierDashboard } from "@/components/CleanSupplierDashboard";

export default function SuppliersPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Supplier Dashboard
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Get instant funding for your invoices. Complete KYC verification and submit your documents to start.
          </p>
        </div>
        
        <CleanSupplierDashboard />
      </div>
    </div>
  );
}
