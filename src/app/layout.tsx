import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { WalletProvider } from "@/components/WalletProvider";
import { Toaster } from "@/components/ui/toaster";
import { AppHeader } from "@/components/AppHeader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Invera - Real-World Asset Financing",
  description: "Decentralized accrued income financing platform on Aptos blockchain",
  applicationName: "Invera",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
            <AppHeader />
            <main>
              {children}
            </main>
          </div>
          <Toaster />
        </WalletProvider>
      </body>
    </html>
  );
}
