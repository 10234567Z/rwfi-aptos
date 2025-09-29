"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CleanKYCUpload } from "@/components/CleanKYCUpload";
import { CleanIncomeForm } from "@/components/CleanIncomeForm";
import { InvoiceManagement } from "@/components/InvoiceManagement";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useKYC } from "@/hooks/useKYC";

type SupplierStep = "kyc-verification" | "create-income" | "manage-income";

export function CleanSupplierDashboard() {
  const { account } = useWallet();
  const [currentStep, setCurrentStep] = useState<SupplierStep>("kyc-verification");
  const { kycStatus} = useKYC();

  const handleKYCSubmitted = () => {
    // Stay on KYC step until approved
  };

  const handleIncomeCreated = () => {
    setCurrentStep("manage-income");
  };

  // Auto-advance to next step based on KYC status
  const canProceedToCreateIncome = kycStatus;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Progress Steps - Clean Design */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {/* Step 1: KYC */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg transition-all ${
                kycStatus
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-200' 
                  : !kycStatus 
                  ? 'bg-amber-500 shadow-lg shadow-amber-200' 
                  : currentStep === "kyc-verification" 
                  ? 'bg-blue-500 shadow-lg shadow-blue-200' 
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}>
                {kycStatus === true ? '✓' : '1'}
              </div>
              <span className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                KYC Verification
              </span>
              {kycStatus !== null && (
                <span className={`mt-1 text-xs px-2 py-1 rounded-full ${
                  kycStatus
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                    : kycStatus === false
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {kycStatus ? "Approved" : "Pending Review"}
                </span>
              )}
            </div>

            {/* Connector Line */}
            <div className={`flex-1 h-0.5 mx-6 transition-all ${
              canProceedToCreateIncome 
                ? 'bg-emerald-300' 
                : 'bg-slate-200 dark:bg-slate-700'
            }`} />

            {/* Step 2: Create Income */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg transition-all ${
                canProceedToCreateIncome && currentStep === "create-income" 
                  ? 'bg-blue-500 shadow-lg shadow-blue-200' 
                  : canProceedToCreateIncome 
                  ? 'bg-slate-400 hover:bg-blue-400 cursor-pointer' 
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}>
                2
              </div>
              <span className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                Create Income
              </span>
            </div>

            {/* Connector Line */}
            <div className={`flex-1 h-0.5 mx-6 transition-all ${
              currentStep === "manage-income" 
                ? 'bg-emerald-300' 
                : 'bg-slate-200 dark:bg-slate-700'
            }`} />

            {/* Step 3: Manage */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg transition-all ${
                currentStep === "manage-income" 
                  ? 'bg-blue-500 shadow-lg shadow-blue-200' 
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}>
                3
              </div>
              <span className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                Manage & Fund
              </span>
            </div>
          </div>

          {/* Step Navigation */}
          <div className="flex justify-center space-x-4 mt-8">
            <Button
              onClick={() => setCurrentStep("kyc-verification")}
              variant={currentStep === "kyc-verification" ? "default" : "outline"}
              className={currentStep === "kyc-verification" 
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg" 
                : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              }
            >
              KYC
            </Button>
            <Button
              onClick={() => setCurrentStep("create-income")}
              variant={currentStep === "create-income" ? "default" : "outline"}
              disabled={!canProceedToCreateIncome}
              className={currentStep === "create-income" 
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg" 
                : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              }
            >
              Create Income
            </Button>
            <Button
              onClick={() => setCurrentStep("manage-income")}
              variant={currentStep === "manage-income" ? "default" : "outline"}
              className={currentStep === "manage-income" 
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg" 
                : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              }
            >
              Manage
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-4xl mx-auto">
          {!account ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
              <div className="text-6xl mb-6">🔗</div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">
                Connect Your Wallet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Please connect your wallet to access the supplier dashboard
              </p>
            </div>
          ) : (
            <>
              {/* Step 1: KYC Verification */}
              {currentStep === "kyc-verification" && (
                <div className="space-y-6">
                  <CleanKYCUpload onKYCSubmitted={handleKYCSubmitted} />
                </div>
              )}

              {/* Step 2: Create Accrued Income */}
              {currentStep === "create-income" && (
                <>
                  {!canProceedToCreateIncome ? (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
                      <div className="text-6xl mb-6">⏳</div>
                      <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">
                        KYC Verification Required
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-lg mb-6">
                        Please complete your KYC verification before creating accrued income entries
                      </p>
                      <Button 
                        onClick={() => setCurrentStep("kyc-verification")} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                      >
                        Complete KYC Verification
                      </Button>
                    </div>
                  ) : (
                    <CleanIncomeForm onIncomeCreated={handleIncomeCreated} />
                  )}
                </>
              )}

              {/* Step 3: Manage Income */}
              {currentStep === "manage-income" && (
                <InvoiceManagement />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
