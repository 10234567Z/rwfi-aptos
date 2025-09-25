"use client";

import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";

export const WalletConnection = () => {
  const { account, connected } = useWallet();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render on server-side to avoid hydration issues
  if (!isMounted) {
    return (
      <div className="animate-pulse bg-gray-700 h-10 w-32 rounded-lg"></div>
    );
  }

  return (
    <div className="flex items-center">
      {connected && account ? (
        <div className="flex items-center space-x-3">
          <WalletSelector />
        </div>
      ) : (
        <WalletSelector />
      )}
    </div>
  );
};
