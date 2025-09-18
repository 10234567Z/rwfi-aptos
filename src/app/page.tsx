"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WalletConnection } from "@/components/WalletConnection";
import { ContractDashboard } from "@/components/ContractDashboard";
import { SupplierDashboard } from "@/components/SupplierDashboard";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

type AppView = "home" | "investor" | "supplier";

export default function Home() {
  const { connected } = useWallet();
  const [currentView, setCurrentView] = useState<AppView>("home");

  if (currentView === "investor") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
        {/* Header with Navigation */}
        <header className="border-b border-gray-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setCurrentView("home")}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">R</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    RWAfi Protocol
                  </h1>
                  <p className="text-xs text-gray-400">Investor Dashboard</p>
                </div>
              </button>
              
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={() => setCurrentView("supplier")}
                  variant="outline"
                  className="border-gray-600 text-gray-400 hover:text-white hover:border-gray-500"
                >
                  Switch to Supplier
                </Button>
                <WalletConnection />
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          {connected ? (
            <ContractDashboard />
          ) : (
            <div className="max-w-4xl mx-auto text-center py-12">
              <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-8">
                  <h2 className="text-white text-xl font-semibold mb-4">Connect Your Wallet</h2>
                  <p className="text-gray-400 mb-6">Connect your wallet to access the investor dashboard</p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (currentView === "supplier") {
    return <SupplierDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Enhanced Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">R</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    RWAfi Protocol
                  </h1>
                  <p className="text-xs text-gray-400">Real-World Asset Financing</p>
                </div>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
            </nav>
            
            <WalletConnection />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Tokenize Real-World Assets
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Revolutionary platform bridging traditional finance with DeFi. 
              Invest in real-world assets or get instant funding for your invoices.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                onClick={() => setCurrentView("investor")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
              >
                🏦 Investor Dashboard
              </Button>
              <Button 
                onClick={() => setCurrentView("supplier")}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-8 py-3 text-lg"
              >
                📄 Supplier Dashboard
              </Button>
            </div>
          </div>

          {/* Platform Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-400 mb-1">$2.5M+</div>
                <div className="text-sm text-gray-400">Total Volume</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-400 mb-1">15.2%</div>
                <div className="text-sm text-gray-400">Avg APY</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-400 mb-1">1,200+</div>
                <div className="text-sm text-gray-400">Active Users</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-400 mb-1">95%</div>
                <div className="text-sm text-gray-400">Success Rate</div>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div id="features" className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Investor Features */}
            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    🏦
                  </div>
                  For Investors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-2">✓</span>
                  Invest in tokenized real-world assets
                </div>
                <div className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-2">✓</span>
                  Earn consistent returns from invoice factoring
                </div>
                <div className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-2">✓</span>
                  Automated risk assessment and diversification
                </div>
                <div className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-2">✓</span>
                  Transparent on-chain transactions
                </div>
              </CardContent>
            </Card>

            {/* Supplier Features */}
            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                    📄
                  </div>
                  For Suppliers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-2">✓</span>
                  Get instant funding for your invoices
                </div>
                <div className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-2">✓</span>
                  Receive 90% of invoice value immediately
                </div>
                <div className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-2">✓</span>
                  Smart contract-based risk assessment
                </div>
                <div className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-2">✓</span>
                  No lengthy approval processes
                </div>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <div id="how-it-works" className="mb-12">
            <h3 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              How It Works
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h4 className="text-white font-semibold mb-2">1. Risk Assessment</h4>
                <p className="text-gray-400 text-sm">
                  Smart contracts automatically assess creditworthiness and business metrics for optimal risk management
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔄</span>
                </div>
                <h4 className="text-white font-semibold mb-2">2. Asset Tokenization</h4>
                <p className="text-gray-400 text-sm">
                  Real-world assets and invoices are tokenized on Aptos blockchain for fractional ownership and liquidity
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <h4 className="text-white font-semibold mb-2">3. Automated Returns</h4>
                <p className="text-gray-400 text-sm">
                  Investors earn returns through epoch-based distributions while suppliers get immediate funding
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <Card className="bg-gradient-to-r from-blue-900/80 to-green-800/90 border-blue-500/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-center text-2xl">Ready to Get Started?</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-300 mb-6">Choose your path and join the future of decentralized finance</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Button 
                  onClick={() => setCurrentView("investor")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Start Investing
                </Button>
                <Button 
                  onClick={() => setCurrentView("supplier")}
                  className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                >
                  Get Funding
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-400">
                <div>
                  <p>💼 <strong>Investors:</strong> Minimum 1 APT</p>
                  <p>📈 Epoch-based returns</p>
                </div>
                <div>
                  <p>📄 <strong>Suppliers:</strong> Instant 90% funding</p>
                  <p>⚡ Smart contract automation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
