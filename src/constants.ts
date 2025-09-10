// Mock constants for frontend development
type Network = string;

export const NETWORK: Network = (process.env.NEXT_PUBLIC_APP_NETWORK as Network) ?? "testnet";
export const MODULE_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS ?? "0x477bc7d5a9cad085f7eea321099f471dc07e33ad8b434b6c8702840df9b36f6d";
export const APTOS_API_KEY = process.env.NEXT_PUBLIC_APTOS_API_KEY;

// RWA System Constants - Updated to new object-deployed contract
export const RWFI_ADDRESS = "0x477bc7d5a9cad085f7eea321099f471dc07e33ad8b434b6c8702840df9b36f6d";

// Admin addresses (contract deployer + additional admins)
export const ADMIN_ADDRESSES = [
  "0x2d6d08a9578aee880cdc191ee29c74ca93fed3ace483b6bc5bf456fbe0d76101", // Contract deployer/admin
] as const;

// Helper function to check if an address is an admin
export const isAdminAddress = (address: string | undefined): boolean => {
  if (!address) return false;
  return ADMIN_ADDRESSES.includes(address as any);
};

// Module names
export const MODULES = {
  SPV: `${RWFI_ADDRESS}::spv`,
} as const;
