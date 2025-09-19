"use client";

import { AdminKYCDashboard } from "@/components/AdminKYCDashboard";

export default function AdminPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Manage KYC verifications and monitor platform activities.
          </p>
        </div>
        
        <AdminKYCDashboard />
      </div>
    </div>
  );
}
