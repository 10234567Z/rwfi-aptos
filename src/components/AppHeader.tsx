"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnection } from "@/components/WalletConnection";

export function AppHeader() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname?.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="border-b border-gray-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                RWAfi Protocol
              </h1>
              <p className="text-xs text-gray-400">Real-World Asset Financing</p>
            </div>
          </Link>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/"
              className={`transition-colors ${
                isActive("/") 
                  ? "text-blue-400 font-medium" 
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Home
            </Link>
            <Link 
              href="/suppliers"
              className={`transition-colors ${
                isActive("/suppliers") 
                  ? "text-blue-400 font-medium" 
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Get Funding
            </Link>
            <Link 
              href="/investors"
              className={`transition-colors ${
                isActive("/investors") 
                  ? "text-blue-400 font-medium" 
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Invest
            </Link>
            <Link 
              href="/admin"
              className={`transition-colors ${
                isActive("/admin") 
                  ? "text-blue-400 font-medium" 
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Admin
            </Link>
          </nav>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <details className="relative">
              <summary className="text-gray-300 cursor-pointer">
                <span className="text-2xl">☰</span>
              </summary>
              <div className="absolute right-0 top-8 bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-2 min-w-[150px]">
                <Link 
                  href="/"
                  className={`block py-2 px-3 rounded transition-colors ${
                    isActive("/") 
                      ? "text-blue-400 bg-blue-900/20" 
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  Home
                </Link>
                <Link 
                  href="/suppliers"
                  className={`block py-2 px-3 rounded transition-colors ${
                    isActive("/suppliers") 
                      ? "text-blue-400 bg-blue-900/20" 
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  Get Funding
                </Link>
                <Link 
                  href="/investors"
                  className={`block py-2 px-3 rounded transition-colors ${
                    isActive("/investors") 
                      ? "text-blue-400 bg-blue-900/20" 
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  Invest
                </Link>
                <Link 
                  href="/admin"
                  className={`block py-2 px-3 rounded transition-colors ${
                    isActive("/admin") 
                      ? "text-blue-400 bg-blue-900/20" 
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  Admin
                </Link>
              </div>
            </details>
          </div>
          
          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            <WalletConnection />
          </div>
        </div>
      </div>
    </header>
  );
}
