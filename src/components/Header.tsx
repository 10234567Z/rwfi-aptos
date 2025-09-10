"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { Button } from "@/components/ui/button";
import { NETWORK } from "@/constants";

export function Header() {
  const { connected, account, disconnect } = useWallet();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">RWA-Fi</h1>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">
                Real World Asset Investment Platform
              </p>
            </div>
          </div>

          {/* Network and Wallet */}
          <div className="flex items-center space-x-4">
            {/* Network indicator */}
            <div className="hidden sm:block">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {NETWORK.toUpperCase()}
              </span>
            </div>

            {/* Wallet Connection */}
            <div className="flex items-center space-x-2">
              {connected && account ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {account.address.toString().slice(0, 6)}...{account.address.toString().slice(-4)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={disconnect}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <WalletSelector />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
