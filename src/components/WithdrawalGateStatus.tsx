"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePoolStats } from "@/hooks/useContract";
import { CheckCircle2, Clock } from "lucide-react";

/**
 * WithdrawalGateStatus Component
 * 
 * Displays the current withdrawal gate status based on C-Flexible-V2 logic.
 * Shows whether full withdrawals are enabled (collections >= funded amount).
 * 
 * Add this component to your investor dashboard for better UX.
 */
export function WithdrawalGateStatus() {
  const { poolStats, loading } = usePoolStats();

  const formatAPT = (octasString?: string): string => {
    if (!octasString) return "0.00";
    return (Number(octasString) / 100_000_000).toFixed(2);
  };

  const calculateProgress = (): number => {
    if (!poolStats?.totalFundedAmount || !poolStats?.totalCollections) return 0;
    const funded = Number(poolStats.totalFundedAmount);
    const collected = Number(poolStats.totalCollections);
    if (funded === 0) return 0;
    return Math.min(100, Math.round((collected / funded) * 100));
  };

  if (loading) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-6">
          <p className="text-gray-400">Loading withdrawal status...</p>
        </CardContent>
      </Card>
    );
  }

  const isFullWithdrawalEnabled = poolStats?.fullWithdrawalEnabled ?? false;
  const progress = calculateProgress();

  return (
    <Card 
      className={`transition-all duration-300 ${
        isFullWithdrawalEnabled 
          ? "bg-green-900/20 border-green-500/50" 
          : "bg-yellow-900/20 border-yellow-500/50"
      }`}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          {isFullWithdrawalEnabled ? (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          ) : (
            <Clock className="h-6 w-6 text-yellow-500" />
          )}
          <div>
            <CardTitle className="text-white">
              {isFullWithdrawalEnabled ? "Full Withdrawals Enabled" : "Partial Withdrawals Only"}
            </CardTitle>
            <CardDescription className={isFullWithdrawalEnabled ? "text-green-300" : "text-yellow-300"}>
              {isFullWithdrawalEnabled 
                ? "All funded capital has been collected" 
                : "Waiting for supplier payments"
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isFullWithdrawalEnabled ? (
          <div className="p-4 bg-green-900/30 rounded-lg border border-green-500/30">
            <p className="text-green-200 font-medium mb-2">
              ✅ You can now withdraw your full investment plus 10% profit
            </p>
            <p className="text-green-300/80 text-sm">
              All supplier invoices have been paid. Withdraw anytime to receive your returns.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 bg-yellow-900/30 rounded-lg border border-yellow-500/30">
              <p className="text-yellow-200 font-medium mb-2">
                ⏳ Limited withdrawals available
              </p>
              <p className="text-yellow-300/80 text-sm mb-3">
                You can withdraw up to 10% (unfunded portion) of your investment anytime.
                Full withdrawals unlock when suppliers complete payments.
              </p>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-yellow-300/70">
                  <span>Collection Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-yellow-500 to-green-500 h-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Total Funded</p>
                <p className="text-lg font-semibold text-white">
                  {formatAPT(poolStats?.totalFundedAmount)} APT
                </p>
                <p className="text-xs text-gray-500">Deployed to suppliers</p>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Total Collected</p>
                <p className="text-lg font-semibold text-white">
                  {formatAPT(poolStats?.totalCollections)} APT
                </p>
                <p className="text-xs text-gray-500">Received from buyers</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
