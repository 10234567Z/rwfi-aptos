"use client";

import { WalletConnection } from "@/components/WalletConnection";
import { ContractDashboard } from "@/components/ContractDashboard";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">RWAfi Protocol</h1>
          <p className="text-lg text-muted-foreground">
            Real World Asset Invoice Factoring on Aptos
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="flex justify-center">
          <WalletConnection />
        </div>

        {/* Contract Dashboard */}
        <ContractDashboard />
      </div>
      
      <Toaster />
    </main>
  );
}
