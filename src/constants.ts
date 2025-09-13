// Mock constants for frontend development
type Network = string;

export const NETWORK: Network = (process.env.NEXT_PUBLIC_APP_NETWORK as Network) ?? "testnet";
export const MODULE_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS;
export const APTOS_API_KEY = process.env.NEXT_PUBLIC_APTOS_API_KEY;

// RWA System Constants - Updated to new object-deployed contract
export const RWFI_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS;

// Admin addresses (contract deployer + additional admins)
export const ADMIN_ADDRESSES = [
  process.env.NEXT_PUBLIC_MODULE_ADDRESS, // Contract deployer/admin
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
