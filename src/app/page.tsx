"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KPIGrid } from "@/components/home/KPIGrid";
import { ProcessSteps } from "@/components/home/ProcessSteps";
import { InvestorExtras } from "@/components/home/InvestorExtras";
import { ProjectedReturns } from "@/components/home/ProjectedReturns";

export default function HomePage() {
  const [view, setView] = useState<'supplier' | 'investor'>('supplier');

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

      {/* Dashboard-style How It Works with Supplier/Investor tabs */}
      <section>
        <div className="container mx-auto bg-gray-100 p-4">
          <div className="flex justify-center mb-4">
            <div className="inline-flex rounded-md shadow-sm" role="tablist" aria-label="View selector">
              <Button
                size="sm"
                className={view === 'supplier' ? 'bg-gradient-to-r from-blue-600 to-blue-900 text-white border-0 px-8 py-4 m-2' : 'bg-gray-100 border-gray-300 text-gray-900 px-8 py-4 m-2'}
                onClick={() => setView('supplier')}
              >
                Supplier POV
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={view === 'investor' ? 'bg-gradient-to-r from-blue-600 to-blue-900 text-white border-0 px-8 py-4 m-2' : 'border-gray-300 bg-gray-100 text-gray-900 px-8 py-4 m-2'}
                onClick={() => setView('investor')}
              >
                Investor POV
              </Button>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-black">How Invera Works</h2>

          <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-3">
                {/* KPI grid + process steps stacked - content switches by view */}
                <div className="space-y-4">

                  {
                    view !== 'investor' && (
                      <>
                        {/* KPI grid is useful for both supplier and investor; keep it as-is */}
                        <KPIGrid />

                        {/* ProcessSteps is a visual flow; reuse for both views to keep visuals consistent */}
                        <ProcessSteps />
                      </>
                    )
                  }

                  {/* Optional short explanatory block for Investor view - kept minimal and factual */}
                  {view === 'investor' && (
                    <>
                      {/* Extended investor-only panel */}
                      <InvestorExtras />

                      {/* Projected returns (UI-only, illustrative) */}
                      <ProjectedReturns rate={0.10} />
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center">
              {view === 'supplier' ? (
                <Link href="/suppliers">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-900 text-white border-0 px-8 py-3 text-lg">Get Funding</Button>
                </Link>
              ) : (
                <Link href="/investors">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-900 text-white border-0 px-8 py-3 text-lg">Start Investing</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
