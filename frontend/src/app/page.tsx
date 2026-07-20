"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Layers,
  ShieldCheck,
  Zap,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
  Lock,
  Wallet,
} from "lucide-react";
import { getConnectedWallet } from "@/lib/stellar";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    getConnectedWallet().then((addr) => setWalletAddress(addr));
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-bgPrimary">
      <Navbar onWalletStateChange={setWalletAddress} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-32">
          {/* Subtle Background Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-accentPrimary/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              {/* Protocol Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accentPrimary/10 border border-accentPrimary/20 text-accentPrimary text-xs font-semibold tracking-wide uppercase">
                <Zap className="w-3.5 h-3.5" />
                Soroban Protocol 22+ Autonomous Payroll
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-textPrimary leading-tight">
                Continuous Team Payroll <br />
                <span className="bg-gradient-to-r from-accentPrimary via-[#e8c383] to-accentSecondary bg-clip-text text-transparent">
                  Every Single Second
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-textSecondary leading-relaxed">
                PayGrid streams real-time salaries directly to employees on Stellar Soroban. Independent vesting streams, instant registry verification, and zero-credit treasury safety.
              </p>

              {/* Action CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-bgPrimary bg-gradient-to-r from-accentPrimary to-[#e8c383] hover:opacity-90 transition shadow-lg shadow-accentPrimary/20 flex items-center justify-center gap-2"
                >
                  Launch Dashboard Grid
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/admin"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-textPrimary bg-bgSurface border border-borderSubtle hover:bg-bgSurfaceHover hover:border-accentPrimary/30 transition flex items-center justify-center gap-2"
                >
                  Admin Treasury Panel
                </Link>
              </div>
            </div>

            {/* Protocol Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
              <div className="surface-card p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accentPrimary/10 text-accentPrimary">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-textSecondary uppercase font-medium tracking-wider">
                    Total Streaming Volume
                  </p>
                  <p className="text-2xl font-bold text-textPrimary mt-0.5">5,000,000 PAY</p>
                </div>
              </div>

              <div className="surface-card p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accentSecondary/10 text-accentSecondary">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-textSecondary uppercase font-medium tracking-wider">
                    Accrual Precision
                  </p>
                  <p className="text-2xl font-bold text-textPrimary mt-0.5">1-Second Ticks</p>
                </div>
              </div>

              <div className="surface-card p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accentSuccess/10 text-accentSuccess">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-textSecondary uppercase font-medium tracking-wider">
                    Treasury Safety
                  </p>
                  <p className="text-2xl font-bold text-textPrimary mt-0.5">Non-Credit Min(Cap)</p>
                </div>
              </div>
            </div>

            {/* Architecture Architecture Features */}
            <div className="mt-20 border-t border-borderSubtle/60 pt-16">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-2xl font-bold text-textPrimary">Production-Grade Soroban Architecture</h2>
                <p className="text-sm text-textSecondary mt-2">
                  Built with strict on-chain safeguards and optimal RPC client design.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="surface-card p-6 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-accentPrimary/10 border border-accentPrimary/20 flex items-center justify-center text-accentPrimary">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-textPrimary text-base">Inter-Contract Registry Check</h3>
                  <p className="text-xs text-textSecondary leading-relaxed">
                    Treasury contract queries employee_registry on every claim. Deactivating an employee halts claims instantly on-chain.
                  </p>
                </div>

                <div className="surface-card p-6 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-accentSecondary/10 border border-accentSecondary/20 flex items-center justify-center text-accentSecondary">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-textPrimary text-base">Batched RPC View (`list_accrued`)</h3>
                  <p className="text-xs text-textSecondary leading-relaxed">
                    Fetches all active employees' accrued balances in a single RPC round trip, driving live tickers with zero network lag.
                  </p>
                </div>

                <div className="surface-card p-6 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-accentWarning/10 border border-accentWarning/20 flex items-center justify-center text-accentWarning">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-textPrimary text-base">Automated Trustline Protection</h3>
                  <p className="text-xs text-textSecondary leading-relaxed">
                    Detects missing PAY SAC token trustlines before submission, providing a 1-click ChangeTrust prompt.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
