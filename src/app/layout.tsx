import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { WalletProvider } from "@/components/WalletProvider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  applicationName: "RWA-Fi",
  title: "RWA-Fi - Real World Asset Investment Platform",
  description: "Decentralized invoice factoring and investment platform powered by Aptos blockchain.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
          <Toaster />
        </WalletProvider>
      </body>
    </html>
  );
}
