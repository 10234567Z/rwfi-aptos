"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import { type PropsWithChildren } from "react";
import { NETWORK, APTOS_API_KEY } from "@/constants";

export const WalletProvider = ({ children }: PropsWithChildren) => {
  // Convert string network to Network enum
  const getNetwork = () => {
    switch (NETWORK.toLowerCase()) {
      case "mainnet":
        return Network.MAINNET;
      case "testnet":
        return Network.TESTNET;
      case "devnet":
        return Network.DEVNET;
      default:
        return Network.DEVNET; // Default fallback
    }
  };

  const network = getNetwork();

  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network,
        aptosApiKeys: APTOS_API_KEY ? {
          [network]: APTOS_API_KEY,
        } : undefined,
      }}
      onError={(error) => {
        console.error("Wallet adapter error:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};
