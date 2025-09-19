"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            RWAfi Protocol
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Revolutionizing Real-World Asset Financing through Decentralized Invoice Factoring
          </p>
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            Connect suppliers with global investors on the Aptos blockchain. Secure, transparent, and efficient funding for your business needs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/suppliers">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-8 py-3 text-lg">
                Get Funding
              </Button>
            </Link>
            <Link href="/investors">
              <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-3 text-lg">
                Start Investing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
            How RWAfi Works
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* For Suppliers */}
            <Card className="bg-gray-900/50 border-gray-800 hover:border-blue-500/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-2xl text-blue-400 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    📋
                  </div>
                  For Suppliers
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Convert your invoices into instant funding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-blue-400 text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Upload Invoice</h4>
                      <p className="text-gray-400 text-sm">Submit your verified invoice and KYC documents</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-blue-400 text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Get Funded</h4>
                      <p className="text-gray-400 text-sm">Receive instant funding at competitive rates</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-blue-400 text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Repay Automatically</h4>
                      <p className="text-gray-400 text-sm">Smart contracts handle repayment when invoice is paid</p>
                    </div>
                  </div>
                </div>
                
                <Link href="/suppliers" className="block">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0">
                    Start Getting Funded
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* For Investors */}
            <Card className="bg-gray-900/50 border-gray-800 hover:border-purple-500/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-2xl text-purple-400 flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    💰
                  </div>
                  For Investors
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Earn returns by funding real-world assets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-purple-400 text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Browse Opportunities</h4>
                      <p className="text-gray-400 text-sm">Review verified invoices and risk assessments</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-purple-400 text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Invest Securely</h4>
                      <p className="text-gray-400 text-sm">Fund invoices with transparent terms</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-purple-400 text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Earn Returns</h4>
                      <p className="text-gray-400 text-sm">Receive profits when invoices are repaid</p>
                    </div>
                  </div>
                </div>
                
                <Link href="/investors" className="block">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0">
                    Start Investing
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 border-t border-gray-800">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">$2.5M+</div>
              <div className="text-gray-400">Total Volume</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">150+</div>
              <div className="text-gray-400">Active Suppliers</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-pink-400 mb-2">89</div>
              <div className="text-gray-400">Verified Investors</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">12%</div>
              <div className="text-gray-400">Avg. APY</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join the future of decentralized finance and unlock the value of your real-world assets.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/suppliers">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-8 py-3">
                Get Funding Now
              </Button>
            </Link>
            <Link href="/investors">
              <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-3">
                Explore Investments
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
