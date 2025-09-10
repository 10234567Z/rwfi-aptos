"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Navigation } from "@/components/Navigation";
import { Dashboard } from "@/components/Dashboard";
import { CreateInvoice } from "@/components/CreateInvoice";
import { InvoiceList } from "@/components/InvoiceList";
import { InvestmentPool } from "@/components/InvestmentPool";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onNavigate={setActiveTab} />;
      case "create-invoice":
        return <CreateInvoice />;
      case "invoices":
        return <InvoiceList />;
      case "investment-pool":
        return <InvestmentPool />;
      case "admin":
        return (
          <div className="max-w-4xl mx-auto py-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Panel</h2>
            <p className="text-gray-600">Admin functionality coming soon...</p>
          </div>
        );
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}
