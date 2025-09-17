"use client";

import { useState, useEffect } from "react";
import { useWallet, type InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { aptos, CONTRACT_FUNCTIONS } from "@/utils/aptosClient";

// Hook for reading pool statistics
export function usePoolStats() {
  const [poolStats, setPoolStats] = useState<{
    totalInvested: string;
    totalCollections: string;
    availableForFunding: string;
    totalFundedIncomes: string;
    reserved: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPoolStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_POOL_STATS,
          functionArguments: [],
        },
      });

      if (result && Array.isArray(result) && result.length >= 5) {
        setPoolStats({
          totalInvested: result[0]?.toString() || "0",
          totalCollections: result[1]?.toString() || "0",
          availableForFunding: result[2]?.toString() || "0",
          totalFundedIncomes: result[3]?.toString() || "0",
          reserved: result[4]?.toString() || "0",
        });
      }
    } catch (err) {
      console.error("Error fetching pool stats:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch pool stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoolStats();
  }, []);

  return { poolStats, loading, error, refetch: fetchPoolStats };
}

// Hook for reading investor information
export function useInvestorInfo() {
  const { account } = useWallet();
  const [investorInfo, setInvestorInfo] = useState<{
    joinEpoch: string;
    lastClaimEpoch: string;
  } | null>(null);
  const [availableReturns, setAvailableReturns] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestorInfo = async () => {
    if (!account?.address) return;

    try {
      setLoading(true);
      setError(null);
      
      // Get investor epoch info
      const epochResult = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_INVESTOR_EPOCH_INFO,
          functionArguments: [account.address.toString()],
        },
      });

      if (epochResult && Array.isArray(epochResult) && epochResult.length >= 2) {
        setInvestorInfo({
          joinEpoch: epochResult[0]?.toString() || "0",
          lastClaimEpoch: epochResult[1]?.toString() || "0",
        });
      }

      // Get available returns
      const returnsResult = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.CALCULATE_AVAILABLE_RETURNS,
          functionArguments: [account.address.toString()],
        },
      });

      if (returnsResult && Array.isArray(returnsResult)) {
        setAvailableReturns(returnsResult[0]?.toString() || "0");
      }
    } catch (err) {
      console.error("Error fetching investor info:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch investor info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account?.address) {
      fetchInvestorInfo();
    }
  }, [account?.address]);

  return { investorInfo, availableReturns, loading, error, refetch: fetchInvestorInfo };
}

// Hook for investment transactions
export function useInvestment() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const investApt = async (amount: string) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    try {
      setLoading(true);
      setError(null);

      // Convert amount to u64 string format (no decimals)
      const amountU64 = Math.floor(Number(amount)).toString();

      const transaction: InputTransactionData = {
        data: {
          function: CONTRACT_FUNCTIONS.INVEST_APT,
          functionArguments: [amountU64],
        },
      };

      console.log("Submitting investment transaction:", transaction);
      const response = await signAndSubmitTransaction(transaction);
      console.log("Transaction response:", response);
      
      // Wait for transaction to complete
      if (response.hash) {
        await aptos.waitForTransaction({ transactionHash: response.hash });
      }
      
      return response;
    } catch (err) {
      console.error("Error investing APT:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to invest APT";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { investApt, loading, error };
}

// Hook for withdrawal transactions
export function useWithdrawal() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withdrawReturns = async (invTokenAmount: string, useEpochBased: boolean = true) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    try {
      setLoading(true);
      setError(null);

      // Convert amount to u64 string format (no decimals)
      const amountU64 = Math.floor(Number(invTokenAmount)).toString();

      const functionName = useEpochBased 
        ? CONTRACT_FUNCTIONS.WITHDRAW_RETURNS_EPOCH_BASED
        : CONTRACT_FUNCTIONS.WITHDRAW_RETURNS;

      const transaction: InputTransactionData = {
        data: {
          function: functionName,
          functionArguments: [amountU64],
        },
      };

      console.log("Submitting withdrawal transaction:", transaction);
      const response = await signAndSubmitTransaction(transaction);
      console.log("Transaction response:", response);
      
      // Wait for transaction to complete
      if (response.hash) {
        await aptos.waitForTransaction({ transactionHash: response.hash });
      }
      
      return response;
    } catch (err) {
      console.error("Error withdrawing returns:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to withdraw returns";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { withdrawReturns, loading, error };
}

// Hook for current epoch information
export function useCurrentEpoch() {
  const [currentEpoch, setCurrentEpoch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentEpoch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_CURRENT_EPOCH,
          functionArguments: [],
        },
      });

      if (result && Array.isArray(result)) {
        setCurrentEpoch(result[0]?.toString() || "0");
      }
    } catch (err) {
      console.error("Error fetching current epoch:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch current epoch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentEpoch();
  }, []);

  return { currentEpoch, loading, error, refetch: fetchCurrentEpoch };
}
