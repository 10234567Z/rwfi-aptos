"use client";

import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WalletSelector } from "@/components/WalletSelector";
import { InvoiceManagement } from "@/components/InvoiceManagement";
import { InvestmentPoolDashboard } from "@/components/InvestmentPoolDashboard";
import { AdminPanel } from "@/components/AdminPanel";
import { RWFI_ADDRESS, ADMIN_ADDRESSES, isAdminAddress } from "@/constants";

type TabType = "overview" | "invoices" | "investment" | "admin";

export function RWADashboard() {
  const { connected, account } = useWallet();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const isAdmin = isAdminAddress(account?.address?.toString());

  if (!connected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">I</span>
              </div>
              <div className="text-center">
                <CardTitle className="text-4xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Invendor
                </CardTitle>
                <p className="text-gray-600 text-lg">Invoice Factoring Platform</p>
              </div>
            </div>
            <CardTitle className="text-center text-xl">🔗 Connect Your Wallet</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-gray-600">
              Connect your Aptos wallet to access the Invendor platform and start factoring invoices
            </p>
            <WalletSelector />
            <div className="mt-8 p-6 bg-white rounded-xl shadow-sm">
              <h3 className="font-semibold mb-4 text-gray-800">Platform Features:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Create and manage invoices</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Invest in invoice pools for yield</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Real-time tracking and analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Secure blockchain transactions</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as const, label: "📊 Overview", description: "Platform statistics and metrics" },
    { id: "invoices" as const, label: "📄 Invoices", description: "Create and manage invoices" },
    { id: "investment" as const, label: "💰 Investment", description: "Pool investments and returns" },
    ...(isAdmin ? [{ id: "admin" as const, label: "🔧 Admin", description: "Platform administration" }] : []),
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">I</span>
            </div>
            <div>
              <CardTitle className="text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Invendor
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Decentralized invoice factoring powered by Aptos blockchain
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation Tabs */}
      <Card className="bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id)}
                className={`h-auto p-4 flex flex-col items-start space-y-2 transition-all ${
                  activeTab === tab.id 
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg" 
                    : "hover:bg-gray-50 hover:border-blue-300"
                }`}
              >
                <span className="text-lg font-medium">{tab.label}</span>
                <span className={`text-xs ${activeTab === tab.id ? "text-blue-100" : "text-gray-500"}`}>
                  {tab.description}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "invoices" && <InvoiceManagement />}
        {activeTab === "investment" && <InvestmentPoolDashboard />}
        {activeTab === "admin" && isAdmin && <AdminPanel />}
      </div>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Platform Overview */}
      <Card>
        <CardHeader>
          <CardTitle>🌟 Platform Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">Live</div>
              <div className="text-sm text-gray-500">Platform Status</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">Devnet</div>
              <div className="text-sm text-gray-500">Network</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">8-12%</div>
              <div className="text-sm text-gray-500">Target APY</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">Active</div>
              <div className="text-sm text-gray-500">Smart Contracts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>🔄 How Invoice Factoring Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Supplier Flow */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-600">For Suppliers</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <div>
                    <p className="font-medium">Create Invoice</p>
                    <p className="text-sm text-gray-600">Submit invoices with buyer information and due dates</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <div>
                    <p className="font-medium">Get Instant Funding</p>
                    <p className="text-sm text-gray-600">Receive 90-95% of invoice value immediately</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <div>
                    <p className="font-medium">Improve Cash Flow</p>
                    <p className="text-sm text-gray-600">Use funds immediately without waiting for payment</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Investor Flow */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-green-600">For Investors</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <div>
                    <p className="font-medium">Invest APT</p>
                    <p className="text-sm text-gray-600">Add APT tokens to the investment pool</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <div>
                    <p className="font-medium">Automatic Funding</p>
                    <p className="text-sm text-gray-600">Your funds automatically purchase invoices</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <div>
                    <p className="font-medium">Earn Returns</p>
                    <p className="text-sm text-gray-600">Receive proportional yields when invoices are paid</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Information */}
      <Card>
        <CardHeader>
          <CardTitle>🔗 Smart Contract Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold">Invoice Registry</h4>
                <p className="text-sm text-gray-600 break-all">
                  0x12dfd30777ab3d19c7c572d1784b7d88097f01196ea8ea107c8d80e63ebc29dd::invoice_registery
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold">Invoice Coin</h4>
                <p className="text-sm text-gray-600 break-all">
                  0x12dfd30777ab3d19c7c572d1784b7d88097f01196ea8ea107c8d80e63ebc29dd::invoice_coin
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold">SPV Contract</h4>
                <p className="text-sm text-gray-600 break-all">
                  0x12dfd30777ab3d19c7c572d1784b7d88097f01196ea8ea107c8d80e63ebc29dd::spv
                </p>
              </div>
            </div>
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => window.open("https://explorer.aptoslabs.com/account/0x12dfd30777ab3d19c7c572d1784b7d88097f01196ea8ea107c8d80e63ebc29dd?network=devnet", "_blank")}
              >
                View on Aptos Explorer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>✨ Platform Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-600">Supplier Benefits</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Immediate access to cash from outstanding invoices
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Improved cash flow and working capital
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  No debt or credit requirements
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Transparent and automated process
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-green-600">Investor Benefits</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Earn steady yields from real-world assets
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Diversified exposure to invoice portfolios
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Automated investment and yield distribution
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Transparent on-chain transactions
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Information */}
      <Card>
        <CardHeader>
          <CardTitle>🔗 Contract Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Smart Contract Address</h4>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                {RWFI_ADDRESS}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Network</h4>
              <p className="text-sm">Aptos Devnet</p>
              <h4 className="font-semibold mb-2 mt-4">Modules</h4>
              <ul className="text-sm space-y-1">
                <li>• invoice_registery - Invoice management</li>
                <li>• spv - Special Purpose Vehicle</li>
                <li>• invoice_coin - Payment token</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Platform Administration</h4>
              <p className="text-sm text-gray-600 mb-2">Authorized Admins: {ADMIN_ADDRESSES.length}</p>
              <div className="space-y-1">
                {ADMIN_ADDRESSES.map((addr, index) => (
                  <div key={addr} className="text-xs">
                    <span className="font-medium">
                      {index === 0 ? "Contract Deployer" : `Admin ${index}`}:
                    </span>
                    <p className="font-mono bg-gray-50 p-1 rounded mt-1 break-all">
                      {addr}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
