"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useKYC } from "@/hooks/useKYC";
import { KYC_LEVEL, KYC_STATUS } from "@/utils/aptosClient";
import { uploadMultipleToIPFS } from "@/utils/ipfsService";

interface CleanKYCUploadProps {
  onKYCSubmitted?: () => void;
}

export function CleanKYCUpload({ onKYCSubmitted }: CleanKYCUploadProps) {
  const { toast } = useToast();
  const { submitKYCDocuments, kycStatus, getKYCStatusText, loading } = useKYC();
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [kycLevel, setKycLevel] = useState<number>(KYC_LEVEL.BASIC);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file types
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const validFiles = files.filter(file => allowedTypes.includes(file.type));
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid File Type",
        description: "Please upload only PDF, JPEG, JPG, or PNG files",
        variant: "destructive",
      });
    }
    
    setSelectedFiles(validFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      toast({
        title: "No Documents Selected",
        description: "Please select at least one document to upload",
        variant: "destructive",
      });
      return;
    }

    if (kycStatus === false) {
      toast({
        title: "KYC Already Submitted",
        description: "Your KYC application is already under review",
        variant: "destructive",
      });
      return;
    }

    if (kycStatus === true) {
      toast({
        title: "KYC Already Approved",
        description: "Your KYC has already been approved",
        variant: "destructive",
      });
      return;
    }

    if (kycStatus === null) {
      toast({
        title: "KYC Status not Submitted",
        description: "Please check your KYC status before submitting",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Upload all files to IPFS
      toast({
        title: "Uploading to IPFS...",
        description: `Uploading ${selectedFiles.length} document(s) to IPFS. This may take a moment.`,
      });

      const documentHashes = await uploadMultipleToIPFS(selectedFiles);
      
      // Add ipfs:// prefix to the CIDs
      const ipfsHashes = documentHashes.map(cid => `ipfs://${cid}`);

      toast({
        title: "Files Uploaded Successfully",
        description: "Documents uploaded to IPFS. Now submitting to blockchain...",
      });

      // Submit to blockchain
      await submitKYCDocuments(ipfsHashes, kycLevel);

      toast({
        title: "KYC Documents Submitted",
        description: "Your documents have been uploaded to IPFS and submitted for review. You will be notified once approved.",
      });

      setSelectedFiles([]);
      
      if (onKYCSubmitted) {
        onKYCSubmitted();
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit KYC documents",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getRequiredDocuments = (level: number) => {
    if (level === KYC_LEVEL.ENHANCED) {
      return [
        "Government-issued photo ID (passport, driver's license)",
        "Proof of address (utility bill, bank statement)",
        "Proof of income (employment letter, tax returns)",
        "Business registration (if applicable)",
      ];
    }
    return [
      "Government-issued photo ID (passport, driver's license)",
      "Proof of address (utility bill, bank statement)",
    ];
  };

  const canSubmit = kycStatus === false || kycStatus === null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Identity Verification
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Complete your KYC to unlock funding features
            </p>
          </div>
          {kycStatus !== null && (
            <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
              kycStatus === true
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              Status: {kycStatus === true ? "Approved" : "Not Submitted/Pending"}
            </div>
          )}
        </div>

        {!canSubmit ? (
          <div className="text-center py-12">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              kycStatus === null
                ? 'bg-amber-100 dark:bg-amber-900'
                : 'bg-emerald-100 dark:bg-emerald-900'
            }`}>
              <span className="text-2xl">
                {!kycStatus ? "⏳" : "✅"}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              {!kycStatus ? "KYC Pending" : "KYC Approved"}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {!kycStatus && "Your application is under review. We'll notify you once it's processed."}
              {kycStatus && "Your KYC is approved! You can now create and fund accrued income."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* KYC Level Selection */}
            <div>
              <Label className="text-slate-700 dark:text-slate-300 text-base font-medium">
                Verification Level
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <button
                  type="button"
                  onClick={() => setKycLevel(KYC_LEVEL.BASIC)}
                  className={`p-6 rounded-lg border-2 text-left transition-all ${
                    kycLevel === KYC_LEVEL.BASIC
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                  }`}
                >
                  <div className="font-semibold text-slate-900 dark:text-white text-lg">Basic KYC</div>
                  <div className="text-slate-600 dark:text-slate-400 mt-1">Standard verification for basic features</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setKycLevel(KYC_LEVEL.ENHANCED)}
                  className={`p-6 rounded-lg border-2 text-left transition-all ${
                    kycLevel === KYC_LEVEL.ENHANCED
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                  }`}
                >
                  <div className="font-semibold text-slate-900 dark:text-white text-lg">Enhanced KYC</div>
                  <div className="text-slate-600 dark:text-slate-400 mt-1">Higher limits and premium features</div>
                </button>
              </div>
            </div>

            {/* Required Documents */}
            <div>
              <Label className="text-slate-700 dark:text-slate-300 text-base font-medium">
                Required Documents
              </Label>
              <div className="mt-3 p-6 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <ul className="space-y-3">
                  {getRequiredDocuments(kycLevel).map((doc, index) => (
                    <li key={index} className="flex items-start text-slate-700 dark:text-slate-300">
                      <span className="text-emerald-500 mr-3 mt-1 text-sm">●</span>
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <Label htmlFor="documents" className="text-slate-700 dark:text-slate-300 text-base font-medium">
                Upload Documents
              </Label>
              <div className="mt-3">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
                  <input
                    id="documents"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="hidden"
                    required
                  />
                  <label htmlFor="documents" className="cursor-pointer">
                    <div className="text-4xl mb-4">📁</div>
                    <div className="text-slate-700 dark:text-slate-300 font-medium mb-2">
                      Click to upload your documents
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-sm">
                      Supported formats: PDF, JPEG, JPG, PNG (Max 10MB per file)
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div>
                <Label className="text-slate-700 dark:text-slate-300 text-base font-medium">
                  Selected Files ({selectedFiles.length})
                </Label>
                <div className="mt-3 space-y-3">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">📄</span>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{file.name}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-700 text-xl"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || uploading || selectedFiles.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading Documents..." : loading ? "Submitting..." : "Submit KYC Application"}
            </Button>

            {/* Privacy Notice */}
            <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start">
                <span className="text-amber-600 dark:text-amber-400 text-xl mr-3">🔒</span>
                <div>
                  <div className="font-medium text-amber-800 dark:text-amber-200 mb-1">Privacy Notice</div>
                  <div className="text-amber-700 dark:text-amber-300 text-sm">
                    Your documents are encrypted and stored securely. They will only be used for identity verification purposes and will not be shared with third parties.
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
