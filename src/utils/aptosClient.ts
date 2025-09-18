import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x53095ac83890c3dbdc58b3b7b17b719f24d9a9a9e81dd82fa5e535d841b3362d";
export const APTOS_NETWORK = Network.DEVNET;

// Debug log to check if CONTRACT_ADDRESS is properly loaded
if (typeof window !== 'undefined') {
  console.log("CONTRACT_ADDRESS:", CONTRACT_ADDRESS);
}

const config = new AptosConfig({
  network: APTOS_NETWORK,
  clientConfig: {
    API_KEY: process.env.NEXT_PUBLIC_APTOS_API_KEY || "AG-F9SPTCXQX4UW7A4KNMUDJSMZNA92BHS2V",
  },
});

export const aptos = new Aptos(config);

// Income Types (from contract)
export const INCOME_TYPES = {
  SALARY: 1,
  SUBSCRIPTION: 2,
  FREELANCE: 3,
  BUSINESS_INVOICE: 4,
  OTHER: 5,
} as const;

// Industry Types (for risk assessment)
export const INDUSTRY_TYPES = {
  TECHNOLOGY: 1,
  HEALTHCARE: 2,
  FINANCE: 3,
  RETAIL: 4,
  MANUFACTURING: 5,
  EDUCATION: 6,
  REAL_ESTATE: 7,
  CONSULTING: 8,
  OTHER: 9,
} as const;

// Income Status
export const INCOME_STATUS = {
  PENDING: 1,
  FUNDED: 2,
  COLLECTED: 3,
  CANCELLED: 4,
} as const;

// Contract function names
export const CONTRACT_FUNCTIONS = {
  // Investment functions
  INVEST_APT: `${CONTRACT_ADDRESS}::spv::invest_apt`,
  WITHDRAW_RETURNS: `${CONTRACT_ADDRESS}::spv::withdraw_returns`,
  WITHDRAW_RETURNS_EPOCH_BASED: `${CONTRACT_ADDRESS}::spv::withdraw_returns_epoch_based`, // Legacy - deprecated
  WITHDRAW_RETURNS_TIMESTAMP_BASED: `${CONTRACT_ADDRESS}::spv::withdraw_returns_timestamp_based`, // New correct function
  
  // View functions
  GET_POOL_STATS: `${CONTRACT_ADDRESS}::spv::get_pool_stats`,
  GET_INVESTOR_INFO: `${CONTRACT_ADDRESS}::spv::get_investor_info`,
  GET_INVESTOR_EPOCH_INFO: `${CONTRACT_ADDRESS}::spv::get_investor_epoch_info`,
  GET_CURRENT_EPOCH: `${CONTRACT_ADDRESS}::spv::get_current_epoch`,
  CALCULATE_AVAILABLE_RETURNS: `${CONTRACT_ADDRESS}::spv::calculate_available_returns_for_investor`,
  CALCULATE_WITHDRAWAL_AMOUNT_TIMESTAMP_BASED: `${CONTRACT_ADDRESS}::spv::calculate_withdrawal_amount_timestamp_based`, // New function
  CALCULATE_TOTAL_WITHDRAWABLE: `${CONTRACT_ADDRESS}::spv::calculate_withdrawal_amount_timestamp_based`, // Alias for compatibility
  
  // Risk management functions
  SUBMIT_RISK_ASSESSMENT: `${CONTRACT_ADDRESS}::spv::submit_risk_assessment`,
  GET_SUPPLIER_RISK_PROFILE: `${CONTRACT_ADDRESS}::spv::get_supplier_risk_profile`,
  CALCULATE_RISK_SCORE: `${CONTRACT_ADDRESS}::spv::calculate_risk_score`,
  GET_RISK_MANAGEMENT_CONFIG: `${CONTRACT_ADDRESS}::spv::get_risk_management_config`,
  
  // Invoice management functions
  CREATE_ACCRUED_INCOME: `${CONTRACT_ADDRESS}::accrued_income_registry::create_accrued_income`,
  GET_INCOME: `${CONTRACT_ADDRESS}::accrued_income_registry::get_income`,
  GET_ALL_INCOMES: `${CONTRACT_ADDRESS}::accrued_income_registry::get_all_incomes`,
  GET_PENDING_INCOMES: `${CONTRACT_ADDRESS}::accrued_income_registry::get_pending_incomes`,
  GET_REGISTRY_STATS: `${CONTRACT_ADDRESS}::accrued_income_registry::get_registry_stats`,
  
  // Admin functions
  FUND_ACCRUED_INCOME: `${CONTRACT_ADDRESS}::spv::fund_accrued_income`,
  FUND_ACCRUED_INCOME_WITH_RISK_CHECK: `${CONTRACT_ADDRESS}::spv::fund_accrued_income_with_risk_check`,
  RECORD_INCOME_COLLECTION: `${CONTRACT_ADDRESS}::spv::record_income_collection`,
  CHECK_AND_MARK_DEFAULTS: `${CONTRACT_ADDRESS}::spv::check_and_mark_defaults`,
} as const;
