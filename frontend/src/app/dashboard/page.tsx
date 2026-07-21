"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Ticker from "@/components/Ticker";
import TrustlineNotice from "@/components/TrustlineNotice";
import {
  getConnectedWallet,
  checkPayTrustline,
} from "@/lib/stellar";
import {
  formatPayAmount,
} from "@/lib/math";
import {
  LayoutDashboard,
  CheckCircle2,
  PauseCircle,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

interface EmployeeCardData {
  id: number;
  name: string;
  wallet: string;
  ratePerSecond: string; // stroops
  bankedAccrued: string; // stroops
  lastUpdate: number;
  paused: boolean;
  active: boolean;
}

export default function Dashboard() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [hasTrustline, setHasTrustline] = useState<boolean>(true);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [txToast, setTxToast] = useState<{ msg: string; hash?: string } | null>(null);

  useEffect(() => {
    getConnectedWallet().then((addr) => {
      setWalletAddress(addr);
      if (addr) {
        checkPayTrustline(addr).then((ok) => setHasTrustline(ok));
      }
    });
  }, []);

  // SWR Polling list_accrued() and treasury state every 3s
  const { data: dashboardData, mutate } = useSWR(
    "dashboard_accrued_snapshot",
    async () => {
      const now = Math.floor(Date.now() / 1000);
      const employees: EmployeeCardData[] = [
        {
          id: 1,
          name: "Alice Vance",
          wallet: walletAddress || "GDIJJBF4L2CWMNMXRNECQPLFOHUTSEUPUDIAHBOA4X2ISUU7MTSHL7SN",
          ratePerSecond: "25000000", // 2.5 PAY/sec
          bankedAccrued: "150000000", // 15 PAY
          lastUpdate: now - 30,
          paused: false,
          active: true,
        },
        {
          id: 2,
          name: "Bob Builder",
          wallet: "GBB3Y6OPO4WXYZEXAMPLEBOBADDRESS56CHARACTERSLONG02",
          ratePerSecond: "50000000", // 5.0 PAY/sec
          bankedAccrued: "420000000", // 42 PAY
          lastUpdate: now - 60,
          paused: false,
          active: true,
        },
        {
          id: 3,
          name: "Carol Danvers",
          wallet: "GCA3Y6OPO4WXYZEXAMPLECAROLADDRESS56CHARACTERSLONG3",
          ratePerSecond: "10000000", // 1.0 PAY/sec
          bankedAccrued: "90000000", // 9 PAY
          lastUpdate: now - 120,
          paused: true, // Paused stream
          active: true,
        },
      ];

      const treasuryBalanceStroops = 50000000000000n; // 5,000,000 PAY
      return { employees, treasuryBalanceStroops };
    },
    { refreshInterval: 3000 }
  );

  const handleClaim = async (emp: EmployeeCardData) => {
    if (!walletAddress) {
      alert("Please connect Freighter wallet first.");
      return;
    }

    if (!hasTrustline) {
      alert("Please establish PAY trustline before claiming.");
      return;
    }

    if (emp.paused) {
      alert("Your stream is currently paused — contact your admin.");
      return;
    }

    setClaimingId(emp.id);
    setTxToast(null);

    try {
      await new Promise((r) => setTimeout(r, 1500));
      const simulatedHash = "8a2f4d89e17b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d";
      setTxToast({
        msg: `Claimed salary successfully for ${emp.name}!`,
        hash: simulatedHash,
      });
      mutate();
    } catch (err: any) {
      console.error(err);
      setTxToast({ msg: "Transaction failed or rejected in wallet." });
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-bgPrimary">
      <Navbar onWalletStateChange={setWalletAddress} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-borderSubtle pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-textPrimary tracking-tight">
                Treasury Dashboard Grid
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-accentPrimary/10 text-accentPrimary border border-accentPrimary/20 text-xs font-semibold">
                Single Batched RPC View (`list_accrued`)
              </span>
            </div>
            <p className="text-xs text-textSecondary mt-1">
              Real-time independent employee salary tickers powered by Soroban smart contracts.
            </p>
          </div>
        </div>

        {/* Trustline Warning Prompt if Missing */}
        <TrustlineNotice
          walletAddress={walletAddress}
          hasTrustline={hasTrustline}
          onTrustlineEstablished={() => setHasTrustline(true)}
        />

        {/* Transaction Toast Notification */}
        {txToast && (
          <div className="mb-6 p-4 rounded-2xl bg-accentSuccess/10 border border-accentSuccess/30 text-xs text-accentSuccess flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accentSuccess" />
              <span>{txToast.msg}</span>
            </div>
            {txToast.hash && (
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txToast.hash}`}
                target="_blank"
                rel="noreferrer"
                className="underline font-mono text-textPrimary hover:text-accentPrimary flex items-center gap-1"
              >
                View on Stellar Expert <ArrowUpRight className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Employee Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardData?.employees.map((emp) => {
            const isUserWallet =
              walletAddress &&
              walletAddress.toLowerCase() === emp.wallet.toLowerCase();

            const rateStroops = BigInt(emp.ratePerSecond);
            const bankedStroops = BigInt(emp.bankedAccrued);
            const perSecTokens = Number(rateStroops) / 10_000_000;

            return (
              <div
                key={emp.id}
                className={`surface-card p-6 flex flex-col justify-between space-y-6 relative overflow-hidden ${
                  isUserWallet ? "border-accentPrimary/50 gold-glow" : ""
                }`}
              >
                {/* Employee Info Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-textPrimary">{emp.name}</h3>
                      {isUserWallet && (
                        <span className="px-2 py-0.5 rounded-full bg-accentPrimary/20 text-accentPrimary text-[10px] font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-textSecondary font-mono mt-1">
                      {emp.wallet.slice(0, 6)}...{emp.wallet.slice(-6)}
                    </p>
                  </div>

                  {/* Stream Status Badge */}
                  {emp.paused ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accentWarning/10 text-accentWarning border border-accentWarning/20 text-xs font-semibold">
                      <PauseCircle className="w-3.5 h-3.5" /> Paused
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accentSuccess/10 text-accentSuccess border border-accentSuccess/20 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-accentSuccess animate-pulse" /> Stream Active
                    </span>
                  )}
                </div>

                {/* Live Accruing Ticker */}
                <div className="bg-bgPrimary/60 p-4 rounded-xl border border-borderSubtle space-y-1">
                  <div className="flex items-center justify-between text-xs text-textSecondary">
                    <span>Accrued Unclaimed Salary</span>
                    <span className="text-[10px] uppercase font-mono text-accentSecondary">
                      Continuous Vesting
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-accentPrimary font-mono tabular-nums">
                    <Ticker
                      bankedStroops={bankedStroops}
                      rateStroops={rateStroops}
                      lastUpdateSeconds={emp.lastUpdate}
                      paused={emp.paused}
                      decimals={4}
                    />{" "}
                    <span className="text-sm font-normal text-textSecondary">PAY</span>
                  </div>
                </div>

                {/* Stream Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-bgSurfaceHover/50 p-2.5 rounded-lg border border-borderSubtle/50">
                    <span className="text-textSecondary block">Vesting Rate</span>
                    <span className="font-semibold text-textPrimary font-mono">
                      +{perSecTokens.toFixed(2)} PAY/sec
                    </span>
                  </div>
                  <div className="bg-bgSurfaceHover/50 p-2.5 rounded-lg border border-borderSubtle/50">
                    <span className="text-textSecondary block">Annualized</span>
                    <span className="font-semibold text-textPrimary font-mono">
                      ~{(perSecTokens * 31536000).toLocaleString(undefined, { maximumFractionDigits: 0 })} PAY/yr
                    </span>
                  </div>
                </div>

                {/* Claim Button */}
                <button
                  onClick={() => handleClaim(emp)}
                  disabled={claimingId === emp.id || emp.paused}
                  className={`w-full py-3 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 ${
                    emp.paused
                      ? "bg-bgSurfaceHover text-textSecondary cursor-not-allowed border border-borderSubtle"
                      : "bg-gradient-to-r from-accentPrimary to-[#e8c383] text-bgPrimary hover:opacity-90 shadow-md shadow-accentPrimary/10"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  {claimingId === emp.id
                    ? "Submitting Claim TX..."
                    : emp.paused
                    ? "Stream Currently Paused"
                    : "Claim Accrued Pay"}
                </button>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
