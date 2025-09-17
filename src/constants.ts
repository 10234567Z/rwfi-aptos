import { Network } from "@aptos-labs/ts-sdk";

// Environment variables with fallbacks
export const NETWORK = (process.env.NEXT_PUBLIC_APTOS_NETWORK as Network) || Network.DEVNET;
export const APTOS_API_KEY = process.env.NEXT_PUBLIC_APTOS_API_KEY!;
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

// Legacy compatibility
export const MODULE_ADDRESS = CONTRACT_ADDRESS;
export const RWFI_ADDRESS = CONTRACT_ADDRESS;

// Validate required environment variables
if (!APTOS_API_KEY) {
  throw new Error("NEXT_PUBLIC_APTOS_API_KEY is required");
}

if (!CONTRACT_ADDRESS) {
  throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS is required");
}

// Admin addresses (contract deployer + additional admins)
export const ADMIN_ADDRESSES = [
  CONTRACT_ADDRESS, // Contract deployer/admin
] as const;

// Helper function to check if an address is an admin
export const isAdminAddress = (address: string | undefined): boolean => {
  if (!address) return false;
  return ADMIN_ADDRESSES.includes(address as any);
};

// Contract function names
export const CONTRACT_FUNCTIONS = {
  // Investment functions
  INVEST_APT: `${CONTRACT_ADDRESS}::spv::invest_apt`,
  WITHDRAW_RETURNS: `${CONTRACT_ADDRESS}::spv::withdraw_returns`,
  WITHDRAW_RETURNS_EPOCH_BASED: `${CONTRACT_ADDRESS}::spv::withdraw_returns_epoch_based`,
  
  // View functions
  GET_POOL_STATS: `${CONTRACT_ADDRESS}::spv::get_pool_stats`,
  GET_CURRENT_EPOCH: `${CONTRACT_ADDRESS}::spv::get_current_epoch`,
  GET_INVESTOR_EPOCH_INFO: `${CONTRACT_ADDRESS}::spv::get_investor_epoch_info`,
  CALCULATE_AVAILABLE_RETURNS: `${CONTRACT_ADDRESS}::spv::calculate_available_returns_for_investor`,
  
  // Invoice functions
  CREATE_ACCRUED_INCOME: `${CONTRACT_ADDRESS}::accrued_income_registry::create_accrued_income`,
  FUND_ACCRUED_INCOME: `${CONTRACT_ADDRESS}::spv::fund_accrued_income`,
  RECORD_INCOME_COLLECTION: `${CONTRACT_ADDRESS}::spv::record_income_collection`,
  
  // Risk assessment
  SUBMIT_RISK_ASSESSMENT: `${CONTRACT_ADDRESS}::spv::submit_risk_assessment`,
} as const;

// Module names (legacy compatibility)
export const MODULES = {
  SPV: `${CONTRACT_ADDRESS}::spv`,
} as const;
