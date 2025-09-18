"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePoolStats } from "@/hooks/useContract";

export function PoolStats() {
  const { poolStats, loading, error } = usePoolStats();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-gray-900/50 border-gray-700 backdrop-blur-sm animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-700 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-700 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500/20 backdrop-blur-sm">
        <CardContent className="pt-6">
          <p className="text-red-400">Error loading pool stats: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const formatAPT = (amount: string) => {
    return (Number(amount) / 100_000_000).toFixed(2);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-gradient-to-br from-blue-900/70 to-blue-800/90 border-blue-500/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-blue-400 text-sm font-medium flex items-center">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
            Total Invested
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {poolStats ? `${formatAPT(poolStats.totalInvested)} APT` : "0 APT"}
          </div>
          <p className="text-xs text-blue-300 mt-1">Total investor capital</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-900/70 to-green-800/90 border-green-500/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-green-400 text-sm font-medium flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            Total Collections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {poolStats ? `${formatAPT(poolStats.totalCollections)} APT` : "0 APT"}
          </div>
          <p className="text-xs text-green-300 mt-1">Returns collected</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-900/70 to-purple-800/90 border-purple-500/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-purple-400 text-sm font-medium flex items-center">
            <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
            Available for Funding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {poolStats ? `${formatAPT(poolStats.availableForFunding)} APT` : "0 APT"}
          </div>
          <p className="text-xs text-purple-300 mt-1">Ready to deploy</p>
        </CardContent>
      </Card>
    </div>
  );
}
