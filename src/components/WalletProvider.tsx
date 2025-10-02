"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { type PropsWithChildren } from "react";
import { Network } from "@aptos-labs/ts-sdk";
import { useEffect, useState } from "react";

export const WalletProvider = ({ children }: PropsWithChildren) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render on server-side to avoid hydration issues
  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network: Network.TESTNET,
        aptosApiKeys: {
          testnet: process.env.NEXT_PUBLIC_APTOS_API_KEY || "",
        },
      }}
      onError={(error) => {
        console.log("Wallet connection error:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};
