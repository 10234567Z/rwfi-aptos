"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { connected, account } = useWallet();

  if (!connected) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to RWA-Fi Platform
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            A decentralized platform for real-world asset investment through invoice factoring
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">For Suppliers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Create invoices and get immediate funding for your outstanding receivables.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Quick invoice creation</li>
                  <li>• Instant liquidity</li>
                  <li>• Transparent process</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">For Investors</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Invest in real-world assets backed by invoices with transparent returns.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Diversified portfolio</li>
                  <li>• Predictable returns</li>
                  <li>• On-chain transparency</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Powered by Aptos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Built on Aptos blockchain for security, speed, and low transaction costs.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Fast transactions</li>
                  <li>• Low fees</li>
                  <li>• High security</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12">
            <p className="text-gray-600 mb-4">
              Connect your Aptos wallet to get started
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back!
        </h2>
        <p className="text-gray-600">
          Connected as: {account?.address.toString()}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onNavigate("invoices")}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              My Invoices
              <span className="text-2xl">📄</span>
            </CardTitle>
            <CardDescription>
              View and manage your created invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              View Invoices
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onNavigate("create-invoice")}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Create Invoice
              <span className="text-2xl">➕</span>
            </CardTitle>
            <CardDescription>
              Create a new invoice for funding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Create New
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onNavigate("investment-pool")}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Investment Pool
              <span className="text-2xl">💰</span>
            </CardTitle>
            <CardDescription>
              View pool status and make investments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              View Pool
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">-</div>
                <div className="text-sm text-gray-500">My Invoices</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">-</div>
                <div className="text-sm text-gray-500">Total Funded</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">-</div>
                <div className="text-sm text-gray-500">Pool Balance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">-</div>
                <div className="text-sm text-gray-500">My Investment</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
