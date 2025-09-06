import type { Network } from "@aptos-labs/wallet-adapter-react";

export const NETWORK: Network = (process.env.NEXT_PUBLIC_APP_NETWORK as Network) ?? "testnet";
export const MODULE_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS ?? "0x63b5d5fff8d1513f6cb123aa7a9b2404a2334c8a994dae8a08a5c2d4dea7e594";
export const APTOS_API_KEY = process.env.NEXT_PUBLIC_APTOS_API_KEY;

// RWA System Constants - Updated to new cleaned contracts
export const RWFI_ADDRESS = "0x63b5d5fff8d1513f6cb123aa7a9b2404a2334c8a994dae8a08a5c2d4dea7e594";

// Admin addresses (contract deployer + additional admins)
export const ADMIN_ADDRESSES = [
  "0xb7a8fe5d2a2fdf09948ae61b15eb4679eadb9b4c6ae9e2a68998b72dbf140db6", // Contract deployer
  "0xee44762fe9beca43542ed0125351f4b44b7049e9c34ed6f6eba1200f2fd21842", // Additional admin
] as const;

// Helper function to check if an address is an admin
export const isAdminAddress = (address: string | undefined): boolean => {
  if (!address) return false;
  return ADMIN_ADDRESSES.includes(address as any);
};

// Module names
export const MODULES = {
  INVOICE_REGISTRY: `${RWFI_ADDRESS}::invoice_registery`,
  INVOICE_COIN: `${RWFI_ADDRESS}::invoice_coin`, 
  SPV: `${RWFI_ADDRESS}::spv`,
} as const;
