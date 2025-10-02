"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KPIGrid } from "@/components/home/KPIGrid";
import { ProcessSteps } from "@/components/home/ProcessSteps";
import { InvestorExtras } from "@/components/home/InvestorExtras";
import InvestorFlow from "@/components/home/InvestorFlow";
import { ProjectedReturns } from "@/components/home/ProjectedReturns";
import { ShieldCheck, BanknoteIcon as BankIcon } from "lucide-react";

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
                variant="outline"
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

                      {/* Flowchart showing how investors earn the fixed yield */}
                      <div className="my-6">
                        <InvestorFlow />
                      </div>

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


            <div>
              <div className="mt-8">
                <div className="flex flex-col gap-6 mt-6">
                  {/* SPV / Insurance Card - polished */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/60 to-slate-50 dark:from-slate-800/60 dark:to-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-2xl">
                    <div className="absolute -right-16 -top-10 opacity-20 transform rotate-45 w-44 h-44 bg-gradient-to-br from-indigo-300 to-violet-400 blur-3xl" />
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-900/60 shadow-sm">
                        <ShieldCheck className="w-8 h-8 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-black">SPV-backed Custody</h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Legal segregation of funded invoices into SPVs with an insurance overlay to protect investors against defined credit events.</p>
                      </div>
                    </div>

                    <ul className="mt-4 text-sm text-gray-500 dark:text-gray-400 space-y-2">
                      <li>Ring-fenced capital per SPV — no commingling with operations.</li>
                      <li>Insurance coverage for eligible credit losses (policy terms apply).</li>
                      <li>Independent trustee & periodic audit reports for full transparency.</li>
                    </ul>
                  </div>

                  {/* Bank Partner / Settlement Card - polished */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/60 to-slate-50 dark:from-slate-800/60 dark:to-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-2xl">
                    <div className="absolute -left-14 -bottom-10 opacity-20 transform -rotate-12 w-44 h-44 bg-gradient-to-br from-emerald-200 to-emerald-400 blur-3xl" />
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-900/60 shadow-sm">
                        <BankIcon className="w-8 h-8 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-black">Bank Partnerships & Settlement</h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Settlement rails and partner guarantees handled by licensed banks to reduce counterparty and settlement risk.</p>
                      </div>
                    </div>

                    <ul className="mt-4 text-sm text-gray-500 dark:text-gray-400 space-y-2">
                      <li>Licensed on/off-ramps for fiat settlement and payouts.</li>
                      <li>Partner-provided backup settlement facilities and reconciliation.</li>
                      <li>Robust AML/KYC and reconciliation processes to maintain flow integrity.</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">We combine legal structures, insurance overlays and regulated banking to deliver predictable investor outcomes and secure supplier payouts.</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
