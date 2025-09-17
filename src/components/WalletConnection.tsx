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
        <div className="flex flex-col">
          {connected && account ? (
            <div className="text-sm">
              <p className="text-gray-600">Connected:</p>
              <p className="font-mono text-xs">{account.address.toString()}</p>
              <p className="text-xs text-gray-500">Network: {network?.name}</p>
            </div>
          ) : (
            <p className="text-gray-600">Not connected</p>
          )}
        </div>
        <WalletSelector />
      </div>
    </div>
  );
};
