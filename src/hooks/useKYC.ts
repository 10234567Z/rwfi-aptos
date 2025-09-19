"use client";

import { useState, useEffect } from "react";
import { useWallet, type InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { aptos, CONTRACT_FUNCTIONS, KYC_STATUS, KYC_LEVEL } from "@/utils/aptosClient";

// Default gas configuration for KYC transactions
const KYC_GAS_CONFIG = {
  maxGasAmount: 300000, // Higher for KYC operations with document handling
  gasUnitPrice: 100,
};

// Helper function to create KYC transaction with gas configuration
const createKYCTransaction = (
  functionName: `${string}::${string}::${string}`, 
  functionArguments: any[]
): InputTransactionData => ({
  data: {
    function: functionName,
    functionArguments,
  },
  options: {
    maxGasAmount: KYC_GAS_CONFIG.maxGasAmount,
    gasUnitPrice: KYC_GAS_CONFIG.gasUnitPrice,
  },
});

// Hook for KYC operations
export function useKYC() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<number | null>(null);
  const [documentHashes, setDocumentHashes] = useState<string[]>([]);

  // Submit KYC documents
  const submitKYCDocuments = async (documentHashes: string[], kycLevel: number = KYC_LEVEL.BASIC) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    try {
      setLoading(true);
      setError(null);

      // Convert string hashes to byte arrays
      const hashesAsBytes = documentHashes.map(hash => 
        Array.from(new TextEncoder().encode(hash))
      );

      const transaction = createKYCTransaction(
        CONTRACT_FUNCTIONS.SUBMIT_KYC_DOCUMENTS,
        [hashesAsBytes, kycLevel]
      );

      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      
      // Refresh KYC status after submission
      await fetchKYCStatus();
      
      return response;
    } catch (err) {
      console.error("Error submitting KYC documents:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to submit KYC documents";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch KYC status
  const fetchKYCStatus = async () => {
    if (!account?.address) return;

    try {
      setLoading(true);
      setError(null);

      const statusResult = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_KYC_STATUS,
          functionArguments: [account.address.toString()],
        },
      });

      const hashesResult = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_DOCUMENT_HASHES,
          functionArguments: [account.address.toString()],
        },
      });

      if (statusResult && statusResult[0] !== undefined) {
        setKycStatus(Number(statusResult[0]));
      }

      if (hashesResult && Array.isArray(hashesResult[0])) {
        // Convert byte arrays back to strings
        const hashes = (hashesResult[0] as any[]).map((hashBytes: any) => {
          if (Array.isArray(hashBytes)) {
            return new TextDecoder().decode(new Uint8Array(hashBytes));
          }
          return String(hashBytes);
        });
        setDocumentHashes(hashes);
      }
    } catch (err) {
      console.error("Error fetching KYC status:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch KYC status");
    } finally {
      setLoading(false);
    }
  };

  // Check if KYC is approved
  const isKYCApproved = async (): Promise<boolean> => {
    if (!account?.address) return false;

    try {
      const result = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.IS_KYC_APPROVED,
          functionArguments: [account.address.toString()],
        },
      });

      return result && result[0] === true;
    } catch (err) {
      console.error("Error checking KYC approval:", err);
      return false;
    }
  };

  // Get KYC status text
  const getKYCStatusText = (status: number | null): string => {
    switch (status) {
      case KYC_STATUS.NONE: return "Not Submitted";
      case KYC_STATUS.PENDING: return "Pending Review";
      case KYC_STATUS.APPROVED: return "Approved";
      case KYC_STATUS.REJECTED: return "Rejected";
      default: return "Unknown";
    }
  };

  // Get KYC status color
  const getKYCStatusColor = (status: number | null): string => {
    switch (status) {
      case KYC_STATUS.NONE: return "text-gray-400 bg-gray-400/10";
      case KYC_STATUS.PENDING: return "text-yellow-400 bg-yellow-400/10";
      case KYC_STATUS.APPROVED: return "text-green-400 bg-green-400/10";
      case KYC_STATUS.REJECTED: return "text-red-400 bg-red-400/10";
      default: return "text-gray-400 bg-gray-400/10";
    }
  };

  // Fetch KYC status on component mount
  useEffect(() => {
    if (account?.address) {
      fetchKYCStatus();
    }
  }, [account?.address]);

  return {
    submitKYCDocuments,
    fetchKYCStatus,
    isKYCApproved,
    getKYCStatusText,
    getKYCStatusColor,
    kycStatus,
    documentHashes,
    loading,
    error,
  };
}

// Hook for admin KYC operations
export function useAdminKYC() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all pending KYC applications
  const getPendingKYCApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_ALL_PENDING_KYC_SUPPLIERS,
          functionArguments: [],
        },
      });
      
      return response[0] as any[]; // Array of SupplierKYCInfo structs
    } catch (err) {
      console.error("Error fetching pending KYC applications:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch pending applications";
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get KYC details for specific supplier
  const getSupplierKYCDetails = async (supplierAddress: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_SUPPLIER_KYC_DETAILS,
          functionArguments: [supplierAddress],
        },
      });
      
      return response[0]; // SupplierKYCInfo struct
    } catch (err) {
      console.error("Error fetching supplier KYC details:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch supplier details";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get KYC statistics
  const getKYCStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_KYC_STATS,
          functionArguments: [],
        },
      });
      
      console.log("Raw KYC stats response:", response);
      
      // Handle different response formats
      let stats;
      if (Array.isArray(response) && response.length >= 4) {
        const [total, pending, approved, rejected] = response as [number, number, number, number];
        stats = { total, pending, approved, rejected };
      } else if (response && typeof response === 'object' && 'data' in response) {
        // Handle case where response has a 'data' wrapper
        const data = (response as any).data;
        if (Array.isArray(data) && data.length >= 4) {
          const [total, pending, approved, rejected] = data;
          stats = { total, pending, approved, rejected };
        } else {
          stats = { total: 0, pending: 0, approved: 0, rejected: 0 };
        }
      } else {
        stats = { total: 0, pending: 0, approved: 0, rejected: 0 };
      }
      
      console.log("Processed stats:", stats);
      return stats;
    } catch (err) {
      console.error("Error fetching KYC stats:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch KYC statistics";
      setError(errorMessage);
      return { total: 0, pending: 0, approved: 0, rejected: 0 };
    } finally {
      setLoading(false);
    }
  };

  // Process KYC application (approve/reject)
  const processKYCApplication = async (supplierAddress: string, approve: boolean) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    try {
      setLoading(true);
      setError(null);

      const transaction: InputTransactionData = {
        data: {
          function: CONTRACT_FUNCTIONS.PROCESS_KYC_APPLICATION,
          functionArguments: [supplierAddress, approve],
        },
      };

      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      
      return response;
    } catch (err) {
      console.error("Error processing KYC application:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to process KYC application";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    getPendingKYCApplications,
    getSupplierKYCDetails,
    getKYCStats,
    processKYCApplication,
    loading,
    error,
  };
}
