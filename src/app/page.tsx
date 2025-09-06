"use client";

import { Header } from "@/components/Header";
import { TopBanner } from "@/components/TopBanner";
import { RWADashboard } from "@/components/RWADashboard";

function App() {
  return (
    <>
      <TopBanner />
      <Header />
      <div className="container mx-auto px-4 py-8">
        <RWADashboard />
      </div>
    </>
  );
}

export default App;
