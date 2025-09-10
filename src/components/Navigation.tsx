"use client";

import { Button } from "@/components/ui/button";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { isAdminAddress } from "@/constants";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { account } = useWallet();
  const isAdmin = isAdminAddress(account?.address.toString());

  const tabs = [
    { id: "dashboard", label: "Dashboard", public: true },
    { id: "invoices", label: "My Invoices", public: false },
    { id: "create-invoice", label: "Create Invoice", public: false },
    { id: "investment-pool", label: "Investment Pool", public: false },
    ...(isAdmin ? [{ id: "admin", label: "Admin Panel", public: false }] : []),
  ];

  return (
    <nav className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => onTabChange(tab.id)}
              className="flex-shrink-0"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
}
