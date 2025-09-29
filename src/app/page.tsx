"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KPIGrid } from "@/components/home/KPIGrid";
import { ProcessSteps } from "@/components/home/ProcessSteps";
import { RecentInvoices } from "@/components/home/RecentInvoices";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-blue-900 bg-clip-text text-transparent">
            Invera
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Revolutionizing Real-World Asset Financing through Decentralized Invoice Factoring
          </p>
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            Connect suppliers with global investors on the Aptos blockchain. Secure, transparent, and efficient funding for your business needs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/suppliers">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-900 hover:from-blue-700 hover:to-blue-950 text-white border-0 px-8 py-3 text-lg">
                Get Funding
              </Button>
            </Link>
            <Link href="/investors">
              <Button size="lg" variant="outline" className="border-gray-600 text-gray-900 hover:text-white hover:bg-gray-800 px-8 py-3 text-lg">
                Start Investing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Dashboard-style How It Works */}
      <section>
        <div className="container mx-auto bg-gray-100 p-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-black">How Invera Works</h2>

          <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-3">
                {/* KPI grid + process steps stacked */}
                <div className="space-y-4">
                  <KPIGrid />
                  <ProcessSteps />
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link href="/suppliers">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-900 text-white border-0 px-8 py-3 text-lg">Get Funding</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
