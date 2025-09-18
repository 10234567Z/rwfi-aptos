"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskAssessmentForm } from "@/components/RiskAssessmentForm";
import { InvoiceCreationForm } from "@/components/InvoiceCreationForm";
import { InvoiceManagement } from "@/components/InvoiceManagement";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useRiskAssessment } from "@/hooks/useContract";

type SupplierStep = "risk-assessment" | "invoice-creation" | "invoice-management";

export function SupplierDashboard() {
  const { account } = useWallet();
  const [currentStep, setCurrentStep] = useState<SupplierStep>("risk-assessment");
  const [riskAssessmentComplete, setRiskAssessmentComplete] = useState(false);
  const { getSupplierRiskProfile } = useRiskAssessment();

  useEffect(() => {
    // Check if user already has a risk assessment on component mount
    const checkExistingRiskAssessment = async () => {
      if (account) {
        try {
          const profile = await getSupplierRiskProfile(account.address.toString());
          if (profile && profile.riskScore > 0) {
            setRiskAssessmentComplete(true);
            setCurrentStep("invoice-creation");
          }
        } catch (error) {
          // No existing risk assessment found, keep default state
          console.log("No existing risk assessment found");
        }
      }
    };

    checkExistingRiskAssessment();
  }, [account, getSupplierRiskProfile]);

  const handleRiskAssessmentComplete = () => {
    setRiskAssessmentComplete(true);
    setCurrentStep("invoice-creation");
  };

  const handleInvoiceCreated = () => {
    setCurrentStep("invoice-management");
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case "risk-assessment":
        return "Complete your risk assessment to unlock invoice funding";
      case "invoice-creation":
        return "Create and submit invoices for immediate funding";
      case "invoice-management":
        return "Track your invoices and manage funding status";
      default:
        return "";
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                🔐
              </div>
              <h2 className="text-white text-xl font-semibold mb-2">Wallet Connection Required</h2>
              <p className="text-gray-400 mb-6">
                Connect your wallet to access the supplier dashboard and start creating invoices
              </p>
              <p className="text-sm text-gray-500">
                Use the wallet connection button in the top navigation
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Supplier Dashboard</h1>
          <p className="text-gray-400">{getStepDescription()}</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                {/* Step 1: Risk Assessment */}
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    riskAssessmentComplete ? "bg-green-600" : currentStep === "risk-assessment" ? "bg-blue-600" : "bg-gray-600"
                  }`}>
                    {riskAssessmentComplete ? "✓" : "1"}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Risk Assessment</h3>
                    <p className="text-sm text-gray-400">Complete your profile</p>
                  </div>
                </div>

                <div className={`flex-1 h-0.5 mx-4 ${riskAssessmentComplete ? "bg-green-600" : "bg-gray-600"}`} />

                {/* Step 2: Invoice Creation */}
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    currentStep === "invoice-management" ? "bg-green-600" : 
                    currentStep === "invoice-creation" ? "bg-blue-600" : "bg-gray-600"
                  }`}>
                    {currentStep === "invoice-management" ? "✓" : "2"}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Create Invoice</h3>
                    <p className="text-sm text-gray-400">Submit for funding</p>
                  </div>
                </div>

                <div className={`flex-1 h-0.5 mx-4 ${
                  currentStep === "invoice-management" ? "bg-green-600" : "bg-gray-600"
                }`} />

                {/* Step 3: Invoice Management */}
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    currentStep === "invoice-management" ? "bg-blue-600" : "bg-gray-600"
                  }`}>
                    3
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Manage Invoices</h3>
                    <p className="text-sm text-gray-400">Track funding status</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Buttons */}
        <div className="mb-6 flex space-x-4">
          <Button
            onClick={() => setCurrentStep("risk-assessment")}
            variant={currentStep === "risk-assessment" ? "default" : "outline"}
            className={currentStep === "risk-assessment" ? 
              "bg-blue-600 hover:bg-blue-700" : 
              "border-gray-600 text-gray-400 hover:text-white hover:border-gray-500"
            }
          >
            Risk Assessment
          </Button>
          
          <Button
            onClick={() => setCurrentStep("invoice-creation")}
            variant={currentStep === "invoice-creation" ? "default" : "outline"}
            disabled={!riskAssessmentComplete}
            className={currentStep === "invoice-creation" ? 
              "bg-blue-600 hover:bg-blue-700" : 
              "border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            }
          >
            Create Invoice
          </Button>
          
          <Button
            onClick={() => setCurrentStep("invoice-management")}
            variant={currentStep === "invoice-management" ? "default" : "outline"}
            className={currentStep === "invoice-management" ? 
              "bg-blue-600 hover:bg-blue-700" : 
              "border-gray-600 text-gray-400 hover:text-white hover:border-gray-500"
            }
          >
            Manage Invoices
          </Button>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {currentStep === "risk-assessment" && (
            <RiskAssessmentForm onAssessmentComplete={handleRiskAssessmentComplete} />
          )}

          {currentStep === "invoice-creation" && riskAssessmentComplete && (
            <InvoiceCreationForm onInvoiceCreated={handleInvoiceCreated} />
          )}

          {currentStep === "invoice-creation" && !riskAssessmentComplete && (
            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  ⚠️
                </div>
                <h2 className="text-white text-xl font-semibold mb-2">Risk Assessment Required</h2>
                <p className="text-gray-400 mb-6">
                  Complete your risk assessment first to unlock invoice creation and funding features
                </p>
                <Button 
                  onClick={() => setCurrentStep("risk-assessment")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Complete Risk Assessment
                </Button>
              </CardContent>
            </Card>
          )}

          {currentStep === "invoice-management" && (
            <InvoiceManagement />
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8">
          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                  💡
                </div>
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    📊
                  </div>
                  <h3 className="text-white font-semibold mb-2">1. Risk Assessment</h3>
                  <p className="text-gray-400 text-sm">
                    Complete your credit profile and business information to determine your funding eligibility and rates
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    📄
                  </div>
                  <h3 className="text-white font-semibold mb-2">2. Create Invoice</h3>
                  <p className="text-gray-400 text-sm">
                    Submit your invoice details and receive 90% of the amount immediately upon approval
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    💰
                  </div>
                  <h3 className="text-white font-semibold mb-2">3. Get Funded</h3>
                  <p className="text-gray-400 text-sm">
                    Track your invoice status and receive payments as soon as your customers pay
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
