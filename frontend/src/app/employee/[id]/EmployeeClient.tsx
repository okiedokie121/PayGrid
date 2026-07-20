"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Ticker from "@/components/Ticker";
import Link from "next/link";
import { ArrowLeft, History, ShieldCheck } from "lucide-react";

export default function EmployeeClient({ id }: { id: string }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const empId = Number(id) || 1;
  const name = empId === 1 ? "Alice Vance" : empId === 2 ? "Bob Builder" : "Carol Danvers";
  const wallet = empId === 1
    ? "GBF3WBOZSO2NM342FRNV6JNAQ7PHZ77SNNSRD262UFBFST6RTJ2VD3RK"
    : empId === 2
    ? "GBB3Y6OPO4WXYZEXAMPLEBOBADDRESS56CHARACTERSLONG02"
    : "GCA3Y6OPO4WXYZEXAMPLECAROLADDRESS56CHARACTERSLONG3";

  const rateStroops = 100000000n; // 10 PAY/sec
  const bankedStroops = 150000000n;
  const lastUpdate = Math.floor(Date.now() / 1000) - 30;

  const history = [
    {
      id: "tx1",
      date: "2026-07-21 04:30",
      amount: "50.0000 PAY",
      hash: "2012c46a9795acd1d3acf70fb6638a7ec94befb397248630349d286b25432afb",
    },
    {
      id: "tx2",
      date: "2026-07-20 18:15",
      amount: "120.0000 PAY",
      hash: "0bc21855c89de12d5f9127a3a41a7c6642b7db6db77334b5a63f985dde5ea3e3",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-bgPrimary">
      <Navbar onWalletStateChange={setWalletAddress} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-textSecondary hover:text-accentPrimary transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard Grid
        </Link>

        <div className="surface-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-borderSubtle pb-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-textPrimary">{name}</h1>
                <span className="text-xs text-textSecondary font-mono">Employee #{empId}</span>
              </div>
              <p className="text-xs text-textSecondary font-mono mt-1">{wallet}</p>
            </div>

            <div className="px-3 py-1 rounded-full bg-accentSuccess/10 text-accentSuccess border border-accentSuccess/20 text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Active Registry Record
            </div>
          </div>

          <div className="bg-bgPrimary/60 p-6 rounded-xl border border-borderSubtle space-y-2">
            <span className="text-xs text-textSecondary uppercase font-medium">
              Live Accruing Unclaimed Salary
            </span>
            <div className="text-4xl font-extrabold text-accentPrimary font-mono">
              <Ticker
                bankedStroops={bankedStroops}
                rateStroops={rateStroops}
                lastUpdateSeconds={lastUpdate}
                paused={false}
                decimals={4}
              />{" "}
              <span className="text-sm font-normal text-textSecondary">PAY</span>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 font-bold text-textPrimary">
              <History className="w-5 h-5 text-accentSecondary" />
              <h3>Historical Payout Claims</h3>
            </div>

            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-bgPrimary/40 p-4 rounded-xl border border-borderSubtle/60 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-accentSuccess font-mono">{item.amount}</span>
                    <span className="text-textSecondary block">{item.date}</span>
                  </div>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${item.hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-mono text-textSecondary hover:text-accentPrimary"
                  >
                    {item.hash.slice(0, 8)}...{item.hash.slice(-8)}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
