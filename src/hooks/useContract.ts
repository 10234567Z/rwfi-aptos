"use client";

import { useState, useEffect } from "react";
import { useWallet, type InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { aptos, CONTRACT_FUNCTIONS, toOctas, toUnixSec, mapAptosError, normalizeAddress } from "@/utils/aptosClient";

// Default gas configuration for transactions
const DEFAULT_GAS_CONFIG = {
  maxGasAmount: 200000, // Increased for complex operations
  gasUnitPrice: 100,    // Standard gas price
};

// Helper function to create transaction with gas configuration
const createTransactionWithGas = (
  functionName: `${string}::${string}::${string}`,
  functionArguments: any[],
  gasConfig = DEFAULT_GAS_CONFIG,
  expireSeconds = 300
): InputTransactionData => ({
  data: {
    function: functionName,
    functionArguments,
  },
  options: {
    maxGasAmount: gasConfig.maxGasAmount,
    gasUnitPrice: gasConfig.gasUnitPrice,
    expireTimestamp: Math.floor(Date.now() / 1000) + expireSeconds,
  },
});

// Centralized tx helper used by hooks to sign, submit and wait
async function submitTransactionWithWallet(
  signAndSubmitTransaction: any,
  tx: InputTransactionData,
  waitOptions: { timeoutSecs?: number; checkSuccess?: boolean } = { timeoutSecs: 60, checkSuccess: true }
) {
  if (!signAndSubmitTransaction) throw new Error("Wallet not available");
  const response = await signAndSubmitTransaction(tx);
  try {
    await aptos.waitForTransaction({ transactionHash: response.hash, options: waitOptions });
  } catch (e) {
    // don't fail hard here; return response and the mapped error if any
    const friendly = mapAptosError(e);
    throw new Error(`${friendly} (tx: ${response.hash})`);
  }
  return response;
}

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
      }); // no address needed

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
    totalInvested: string;
    totalWithdrawn: string;
    invTokens: string;
  } | null>(null);
  const [availableReturns, setAvailableReturns] = useState<string | null>(null);
  const [aptBalance, setAptBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestorInfo = async () => {
    if (!account?.address) return;

    try {
      setLoading(true);
      setError(null);
      
      // Get APT balance
      try {
        const balance = await aptos.getAccountAPTAmount({ accountAddress: account.address.toString() });
        setAptBalance(balance.toString());
      } catch (err) {
        console.log("Failed to get APT balance:", err);
        setAptBalance("0");
      }

      // Get investor epoch info
      const addr = normalizeAddress(account.address?.toString());
      const epochResult = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_INVESTOR_EPOCH_INFO,
          functionArguments: [addr],
        },
      });

      // Get detailed investor info
      const detailedResult = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_INVESTOR_INFO,
          functionArguments: [addr],
        },
      });

      if (epochResult && Array.isArray(epochResult) && epochResult.length >= 2 &&
          detailedResult && Array.isArray(detailedResult) && detailedResult.length >= 5) {
        setInvestorInfo({
          joinEpoch: epochResult[0]?.toString() || "0",
          lastClaimEpoch: epochResult[1]?.toString() || "0",
          totalInvested: detailedResult[1]?.toString() || "0",
          totalWithdrawn: detailedResult[2]?.toString() || "0",
          invTokens: detailedResult[3]?.toString() || "0",
        });
      }

      // Get total withdrawable amount using all their INV tokens
      // const invTokens = detailedResult && detailedResult[4] ? detailedResult[4].toString() : "0";
      
      // Use the simpler available returns calculation for now
      try {
        const withdrawableResult = await aptos.view({
          payload: {
            function: CONTRACT_FUNCTIONS.CALCULATE_AVAILABLE_RETURNS,
            functionArguments: [account.address.toString()],
          },
        });

        if (withdrawableResult && withdrawableResult[0] !== undefined) {
          setAvailableReturns(withdrawableResult[0]!.toString());
        } else {
          setAvailableReturns("0");
        }
      } catch (calcError) {
        console.log("Failed to calculate withdrawable amount, setting to 0:", calcError);
        setAvailableReturns("0");
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

  return { investorInfo, availableReturns, aptBalance, loading, error, refetch: fetchInvestorInfo };
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

  const transaction = createTransactionWithGas(CONTRACT_FUNCTIONS.INVEST_APT, [amount.toString()]);
  const response = await submitTransactionWithWallet(signAndSubmitTransaction, transaction);
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

  const withdrawReturns = async (invTokenAmount: string, useTimestampBased: boolean = true) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    try {
      setLoading(true);
      setError(null);

      // Validate input
      const amount = Number(invTokenAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid withdrawal amount");
      }

      const amountU64 = Math.floor(amount).toString();
      const functionName = useTimestampBased 
        ? CONTRACT_FUNCTIONS.WITHDRAW_RETURNS_TIMESTAMP_BASED
        : CONTRACT_FUNCTIONS.WITHDRAW_RETURNS;

      // Validate that the function name is properly formed
      if (!functionName || typeof functionName !== 'string' || !functionName.includes('::')) {
        throw new Error("Invalid contract function name");
      }

      const transaction: InputTransactionData = {
        data: {
          function: functionName,
          functionArguments: [amountU64],
        },
        options: {
          maxGasAmount: DEFAULT_GAS_CONFIG.maxGasAmount,
          gasUnitPrice: DEFAULT_GAS_CONFIG.gasUnitPrice,
        },
      };

  const response = await submitTransactionWithWallet(signAndSubmitTransaction, transaction);
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

// Hook for risk assessment
export function useRiskAssessment() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitRiskAssessment = async (
    creditScore: number,
    businessAgeMonths: number,
    annualRevenue: string,
    industryType: number
  ) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    try {
      setLoading(true);
      setError(null);

      const transaction: InputTransactionData = {
        data: {
          function: CONTRACT_FUNCTIONS.SUBMIT_RISK_ASSESSMENT,
          functionArguments: [
            creditScore.toString(),
            businessAgeMonths.toString(),
            annualRevenue,
            industryType.toString()
          ],
        },
        options: {
          maxGasAmount: DEFAULT_GAS_CONFIG.maxGasAmount,
          gasUnitPrice: DEFAULT_GAS_CONFIG.gasUnitPrice,
        },
      };

  const response = await submitTransactionWithWallet(signAndSubmitTransaction, transaction);
  return response;
    } catch (err) {
      console.error("Error submitting risk assessment:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to submit risk assessment";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getSupplierRiskProfile = async (supplierAddress?: string) => {
    try {
      const addressToCheck = supplierAddress || account?.address?.toString();
      if (!addressToCheck) return null;

      const result = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_SUPPLIER_RISK_PROFILE,
          functionArguments: [addressToCheck],
        },
      });

      if (result && Array.isArray(result) && result.length >= 2) {
        const exists = result[0] as boolean;
        if (exists) {
          const profile = result[1] as any;
          return {
            creditScore: profile.credit_score?.toString() || "0",
            businessAgeMonths: profile.business_age_months?.toString() || "0",
            annualRevenue: profile.annual_revenue?.toString() || "0",
            industryType: profile.industry_type?.toString() || "0",
            riskScore: profile.risk_score?.toString() || "0",
            approvedForFunding: profile.approved_for_funding || false,
            totalFunded: profile.total_funded?.toString() || "0",
            successfulPayments: profile.successful_payments?.toString() || "0",
            defaults: profile.defaults?.toString() || "0",
          };
        }
      }
      return null;
    } catch (err) {
      console.error("Error fetching supplier risk profile:", err);
      return null;
    }
  };

  return { submitRiskAssessment, getSupplierRiskProfile, loading, error };
}

// Hook for invoice creation
export function useInvoiceCreation() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInvoice = async (
    amount: string,
    dueDateTimestamp: number,
    incomeType: number,
    payerInfo: string,
    payerContact: string,
    description: string
  ) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    try {
      setLoading(true);
      setError(null);

      // Strictly follow MCP guidance: ALWAYS use wallet adapter functions
      // Ensure values are normalized
      const amountOctas = typeof amount === 'string' ? amount : toOctas(amount as any);
      const dueSec = Number(dueDateTimestamp) || toUnixSec(dueDateTimestamp as any);

      const tx = createTransactionWithGas(
        CONTRACT_FUNCTIONS.CREATE_ACCRUED_INCOME,
        [amountOctas.toString(), dueSec.toString(), incomeType.toString(), payerInfo, payerContact, description],
        { maxGasAmount: 500000, gasUnitPrice: 100 },
        300
      );

      const response = await submitTransactionWithWallet(signAndSubmitTransaction, tx, { timeoutSecs: 90, checkSuccess: true });
      return response;
    } catch (err) {
      console.error("Error creating invoice:", err);
      console.error("Full error object:", JSON.stringify(err, null, 2));
      
      // Enhanced error handling based on common Aptos errors
      let errorMessage = "Failed to create invoice";
      
      if (err instanceof Error) {
        const errorStr = err.message.toLowerCase();
        
        if (errorStr.includes("simulation failed")) {
          errorMessage = "Transaction simulation failed. Please check your input values and try again.";
        } else if (errorStr.includes("insufficient funds") || errorStr.includes("insufficient balance")) {
          errorMessage = "Insufficient APT balance for transaction fees. Please add more APT to your wallet.";
        } else if (errorStr.includes("timeout") || errorStr.includes("time out")) {
          errorMessage = "Transaction timeout. Your transaction may still be processing. Please check your transaction history.";
        } else if (errorStr.includes("rate limit") || errorStr.includes("too many requests")) {
          errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
        } else if (errorStr.includes("account sequence number")) {
          errorMessage = "Transaction sequence error. Please refresh and try again.";
        } else if (errorStr.includes("gas")) {
          errorMessage = "Gas estimation failed. Please try again with different parameters.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getSupplierInvoices = async (supplierAddress?: string) => {
    try {
      const addressToCheck = normalizeAddress(supplierAddress || account?.address?.toString());
      if (!addressToCheck) return [];

      const result = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_ALL_INCOMES,
          functionArguments: [addressToCheck],
        },
      });

      if (result) {
        // Normalize result wrapper
        const anyRes: any = result;
        const raw = Array.isArray(anyRes) ? anyRes : (anyRes.data || anyRes);
        // raw should be a vector of incomes
        return (raw as any[]).map((income: any, index: number) => ({
          id: index.toString(),
          amount: income.amount?.toString() || "0",
          due_date: Number(income.due_date?.toString() || "0"),
          income_type: Number(income.income_type?.toString() || "0"),
          payer_info: (() => {
            try {
              // payer_data.info is stored as bytes (vector<u8>) representing JSON
              const bytes = Array.isArray(income.payer_data?.info) ? new Uint8Array(income.payer_data.info) : new Uint8Array();
              return new TextDecoder().decode(bytes) || "";
            } catch (e) { return ""; }
          })(),
          payer_contact: (() => {
            try {
              const bytes = Array.isArray(income.payer_data?.contact) ? new Uint8Array(income.payer_data.contact) : new Uint8Array();
              return new TextDecoder().decode(bytes) || "";
            } catch (e) { return ""; }
          })(),
          description: Array.isArray(income.description) ? new TextDecoder().decode(new Uint8Array(income.description)) : String(income.description || ""),
          status: Number(income.status?.toString() || "0"),
          created_at: Number(income.created_at?.toString() || "0"),
          funded_amount: income.funded_amount?.toString() || "0",
        }));
      }
      return [];
    } catch (err) {
      console.error("Error fetching supplier invoices:", err);
      return [];
    }
  };

  const getPendingInvoices = async (supplierAddress?: string) => {
    try {
      const addressToCheck = supplierAddress || account?.address?.toString();
      if (!addressToCheck) return [];

      const result = await aptos.view({
        payload: {
          function: CONTRACT_FUNCTIONS.GET_PENDING_INCOMES,
          functionArguments: [addressToCheck],
        },
      });

      if (result && Array.isArray(result)) {
        return result.map((income: any, index: number) => ({
          id: index,
          supplierAddr: income.supplier_addr,
          amount: income.amount?.toString() || "0",
          fundedAmount: income.funded_amount?.toString() || "0",
          dueDate: income.due_date?.toString() || "0",
          incomeType: income.income_type?.toString() || "0",
          status: income.status?.toString() || "0",
          description: new TextDecoder().decode(new Uint8Array(income.description || [])),
          createdAt: income.created_at?.toString() || "0",
          fundedAt: income.funded_at?.toString() || "0",
          spvOwned: income.spv_owned || false,
        }));
      }
      return [];
    } catch (err) {
      console.error("Error fetching pending invoices:", err);
      return [];
    }
  };

  return { createInvoice, getSupplierInvoices, getPendingInvoices, loading, error };
}

// Admin: fund an accrued income (callable by admin signer)
export function useAdminFunding() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fundAccruedIncome = async (supplierAddress: string, incomeId: string) => {
    if (!account) throw new Error("Wallet not connected");

    try {
      setLoading(true);
      setError(null);

  const tx = createTransactionWithGas(CONTRACT_FUNCTIONS.FUND_ACCRUED_INCOME, [normalizeAddress(supplierAddress), incomeId.toString()], { maxGasAmount: 400000, gasUnitPrice: 100 }, 120);
      const response = await submitTransactionWithWallet(signAndSubmitTransaction, tx, { timeoutSecs: 120, checkSuccess: true });
      return response;
    } catch (err) {
      console.error("Error funding accrued income:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  return { fundAccruedIncome, loading, error };
}
