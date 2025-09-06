import { aptosClient } from "@/utils/aptosClient";
import { MODULES } from "@/constants";

export interface InvestmentPool {
  remaining_tokens: number;
  funded_tokens: number;
  admin: string;
}

export interface Investor {
  amount_tokens: number;
}

export const getInvestmentPool = async (): Promise<InvestmentPool | null> => {
  try {
    const response = await aptosClient().view({
      payload: {
        function: `${MODULES.SPV}::get_investment_pool`,
        functionArguments: [],
      },
    });

    if (response && response.length > 0) {
      const poolData = response[0] as any;
      return {
        remaining_tokens: Number(poolData.remaining_tokens),
        funded_tokens: Number(poolData.funded_tokens),
        admin: poolData.admin,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching investment pool:", error);
    return null;
  }
};

export const getInvestorInfo = async (investorAddress: string): Promise<Investor | null> => {
  try {
    const response = await aptosClient().view({
      payload: {
        function: `${MODULES.SPV}::get_investor_info`,
        functionArguments: [investorAddress],
      },
    });

    if (response && response.length > 0) {
      const investorData = response[0] as any;
      return {
        amount_tokens: Number(investorData.amount_tokens),
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching investor info:", error);
    return null;
  }
};

export const getInvestorCount = async (): Promise<number> => {
  try {
    const response = await aptosClient().view({
      payload: {
        function: `${MODULES.SPV}::get_investor_count`,
        functionArguments: [],
      },
    });

    return response && response.length > 0 ? Number(response[0]) : 0;
  } catch (error) {
    console.error("Error fetching investor count:", error);
    return 0;
  }
};

export const investorExists = async (investorAddress: string): Promise<boolean> => {
  try {
    const response = await aptosClient().view({
      payload: {
        function: `${MODULES.SPV}::investor_exists`,
        functionArguments: [investorAddress],
      },
    });

    return response && response.length > 0 ? Boolean(response[0]) : false;
  } catch (error) {
    console.error("Error checking investor existence:", error);
    return false;
  }
};
