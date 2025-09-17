import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// Contract configuration
export const CONTRACT_ADDRESS = "0xb6740db2d85d59d4d750e4d6e7660244c426059bc56783dca99ae1d9ab26b4ac";
export const APTOS_NETWORK = Network.DEVNET;

// Initialize Aptos client with API key
const config = new AptosConfig({
  network: APTOS_NETWORK,
  clientConfig: {
    API_KEY: process.env.NEXT_PUBLIC_APTOS_API_KEY || "AG-F9SPTCXQX4UW7A4KNMUDJSMZNA92BHS2V",
  },
});

export const aptos = new Aptos(config);

// Contract function names
export const CONTRACT_FUNCTIONS = {
  // Investment functions
  INVEST_APT: `${CONTRACT_ADDRESS}::spv::invest_apt`,
  WITHDRAW_RETURNS: `${CONTRACT_ADDRESS}::spv::withdraw_returns`,
  WITHDRAW_RETURNS_EPOCH_BASED: `${CONTRACT_ADDRESS}::spv::withdraw_returns_epoch_based`,
  
  // View functions
  GET_POOL_STATS: `${CONTRACT_ADDRESS}::spv::get_pool_stats`,
  GET_INVESTOR_EPOCH_INFO: `${CONTRACT_ADDRESS}::spv::get_investor_epoch_info`,
  GET_CURRENT_EPOCH: `${CONTRACT_ADDRESS}::spv::get_current_epoch`,
  CALCULATE_AVAILABLE_RETURNS: `${CONTRACT_ADDRESS}::spv::calculate_available_returns_for_investor`,
  
  // Invoice functions
  CREATE_INVOICE: `${CONTRACT_ADDRESS}::accrued_income_registry::create_accrued_income`,
  FUND_INVOICE: `${CONTRACT_ADDRESS}::spv::fund_accrued_income`,
  RECORD_COLLECTION: `${CONTRACT_ADDRESS}::spv::record_income_collection`,
  
  // Risk assessment
  SUBMIT_RISK_ASSESSMENT: `${CONTRACT_ADDRESS}::spv::submit_risk_assessment`,
} as const;
