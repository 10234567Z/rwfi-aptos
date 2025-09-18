"use client";

import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";

export const WalletConnection = () => {
  const { account, connected, network } = useWallet();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render on server-side to avoid hydration issues
  if (!isMounted) {
    return <div>Loading wallet...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {connected && account ? (
          <WalletSelector />
        ) : (
          <p className="text-gray-600">Not connected</p>
        )}
      </div>
    </div>
  );
};
