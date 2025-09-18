"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useRiskAssessment } from "@/hooks/useContract";
import { INDUSTRY_TYPES } from "@/utils/aptosClient";

interface RiskAssessmentFormProps {
  onAssessmentComplete?: () => void;
}

export function RiskAssessmentForm({ onAssessmentComplete }: RiskAssessmentFormProps) {
  const { account } = useWallet();
  const { toast } = useToast();
  const { submitRiskAssessment, getSupplierRiskProfile, loading } = useRiskAssessment();

  const [formData, setFormData] = useState({
    creditScore: "",
    businessAgeMonths: "",
    annualRevenue: "",
    industryType: "1"
  });

  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [calculatedRiskScore, setCalculatedRiskScore] = useState<number | null>(null);

  // Load existing risk profile
  useEffect(() => {
    const loadExistingProfile = async () => {
      if (account?.address) {
        const profile = await getSupplierRiskProfile();
        if (profile) {
          setExistingProfile(profile);
          setFormData({
            creditScore: profile.creditScore,
            businessAgeMonths: profile.businessAgeMonths,
            annualRevenue: (Number(profile.annualRevenue) / 100_000_000).toString(),
            industryType: profile.industryType
          });
        }
      }
    };
    loadExistingProfile();
  }, [account?.address]);

  // Calculate risk score in real-time
  useEffect(() => {
    if (formData.creditScore && formData.businessAgeMonths && formData.annualRevenue) {
      const creditScore = parseInt(formData.creditScore);
      const businessAge = parseInt(formData.businessAgeMonths);
      const revenue = parseFloat(formData.annualRevenue);

      if (creditScore >= 300 && creditScore <= 850 && businessAge > 0 && revenue > 0) {
        // Simplified risk calculation (mimicking contract logic)
        let risk = 100; // Start with highest risk
        
        // Credit score factor (higher score = lower risk)
        if (creditScore >= 750) risk -= 40;
        else if (creditScore >= 650) risk -= 25;
        else if (creditScore >= 550) risk -= 10;
        
        // Business age factor (older = lower risk)
        if (businessAge >= 60) risk -= 20;
        else if (businessAge >= 24) risk -= 15;
        else if (businessAge >= 12) risk -= 10;
        else if (businessAge >= 6) risk -= 5;
        
        // Revenue factor (higher revenue = lower risk)
        if (revenue >= 1000000) risk -= 20;
        else if (revenue >= 500000) risk -= 15;
        else if (revenue >= 100000) risk -= 10;
        else if (revenue >= 50000) risk -= 5;
        
        setCalculatedRiskScore(Math.max(0, Math.min(100, risk)));
      }
    }
  }, [formData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to submit risk assessment",
        variant: "destructive",
      });
      return;
    }

    const creditScore = parseInt(formData.creditScore);
    const businessAge = parseInt(formData.businessAgeMonths);
    const revenue = parseFloat(formData.annualRevenue);
    const industry = parseInt(formData.industryType);

    // Validation
    if (creditScore < 300 || creditScore > 850) {
      toast({
        title: "Invalid Credit Score",
        description: "Credit score must be between 300 and 850",
        variant: "destructive",
      });
      return;
    }

    if (businessAge <= 0) {
      toast({
        title: "Invalid Business Age",
        description: "Business age must be greater than 0 months",
        variant: "destructive",
      });
      return;
    }

    if (revenue <= 0) {
      toast({
        title: "Invalid Annual Revenue",
        description: "Annual revenue must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    try {
      const revenueInOctas = (revenue * 100_000_000).toString();
      
      await submitRiskAssessment(
        creditScore,
        businessAge,
        revenueInOctas,
        industry
      );

      toast({
        title: "Risk Assessment Submitted",
        description: `Risk assessment submitted successfully. Calculated risk score: ${calculatedRiskScore}`,
      });

      if (onAssessmentComplete) {
        onAssessmentComplete();
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit risk assessment",
        variant: "destructive",
      });
    }
  };

  const getRiskLevel = (score: number) => {
    if (score <= 20) return { label: "Very Low Risk", color: "text-green-500" };
    if (score <= 40) return { label: "Low Risk", color: "text-green-400" };
    if (score <= 60) return { label: "Medium Risk", color: "text-yellow-500" };
    if (score <= 80) return { label: "High Risk", color: "text-orange-500" };
    return { label: "Very High Risk", color: "text-red-500" };
  };

  const getIndustryName = (type: string) => {
    const industryNames = {
      "1": "Technology",
      "2": "Healthcare", 
      "3": "Finance",
      "4": "Retail",
      "5": "Manufacturing",
      "6": "Education",
      "7": "Real Estate",
      "8": "Consulting",
      "9": "Other"
    };
    return industryNames[type as keyof typeof industryNames] || "Unknown";
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
            📊
          </div>
          Supplier Risk Assessment
        </CardTitle>
        <CardDescription className="text-gray-400">
          {existingProfile ? "Update your risk profile to access funding" : "Complete your risk assessment to be eligible for invoice funding"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {existingProfile && (
          <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
            <h4 className="text-blue-400 font-semibold mb-2">Current Risk Profile</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Risk Score:</span>
                <span className={`ml-2 font-semibold ${getRiskLevel(parseInt(existingProfile.riskScore)).color}`}>
                  {existingProfile.riskScore} ({getRiskLevel(parseInt(existingProfile.riskScore)).label})
                </span>
              </div>
              <div>
                <span className="text-gray-400">Approved:</span>
                <span className={`ml-2 font-semibold ${existingProfile.approvedForFunding ? 'text-green-400' : 'text-red-400'}`}>
                  {existingProfile.approvedForFunding ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Total Funded:</span>
                <span className="ml-2 text-white font-semibold">
                  {(Number(existingProfile.totalFunded) / 100_000_000).toFixed(2)} APT
                </span>
              </div>
              <div>
                <span className="text-gray-400">Success Rate:</span>
                <span className="ml-2 text-white font-semibold">
                  {existingProfile.successfulPayments}/{Number(existingProfile.successfulPayments) + Number(existingProfile.defaults)}
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="creditScore" className="text-gray-300">Credit Score (300-850)</Label>
              <Input
                id="creditScore"
                type="number"
                min="300"
                max="850"
                placeholder="750"
                value={formData.creditScore}
                onChange={(e) => handleInputChange("creditScore", e.target.value)}
                disabled={loading}
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="businessAge" className="text-gray-300">Business Age (Months)</Label>
              <Input
                id="businessAge"
                type="number"
                min="1"
                placeholder="24"
                value={formData.businessAgeMonths}
                onChange={(e) => handleInputChange("businessAgeMonths", e.target.value)}
                disabled={loading}
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="annualRevenue" className="text-gray-300">Annual Revenue (APT)</Label>
              <Input
                id="annualRevenue"
                type="number"
                min="0"
                step="0.01"
                placeholder="100000"
                value={formData.annualRevenue}
                onChange={(e) => handleInputChange("annualRevenue", e.target.value)}
                disabled={loading}
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="industryType" className="text-gray-300">Industry Type</Label>
              <select
                id="industryType"
                value={formData.industryType}
                onChange={(e) => handleInputChange("industryType", e.target.value)}
                disabled={loading}
                className="w-full bg-gray-800/50 border border-gray-600 text-white rounded-md px-3 py-2"
                required
              >
                {Object.entries(INDUSTRY_TYPES).map(([name, value]) => (
                  <option key={value} value={value}>
                    {name.charAt(0) + name.slice(1).toLowerCase().replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {calculatedRiskScore !== null && (
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Calculated Risk Assessment</h4>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Risk Score:</span>
                <span className={`text-lg font-bold ${getRiskLevel(calculatedRiskScore).color}`}>
                  {calculatedRiskScore} - {getRiskLevel(calculatedRiskScore).label}
                </span>
              </div>
              <div className="mt-2 bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                  style={{ width: `${calculatedRiskScore}%` }}
                />
              </div>
            </div>
          )}

          <Button 
            type="submit"
            disabled={loading || !formData.creditScore || !formData.businessAgeMonths || !formData.annualRevenue}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {loading ? "Submitting..." : existingProfile ? "Update Risk Assessment" : "Submit Risk Assessment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
