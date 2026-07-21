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
  getStoredEmployees,
  StoredEmployee,
} from "@/lib/stellar";
import {
  LayoutDashboard,
  CheckCircle2,
  PauseCircle,
  TrendingUp,
  Lock,
} from "lucide-react";

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

  // SWR Polling active employee streams from persistent storage every 2s
  const { data: dashboardData, mutate } = useSWR(
    "dashboard_accrued_snapshot",
    async () => {
      const stored = getStoredEmployees();
      const employees = stored.filter((emp) => emp.active);
      const treasuryBalanceStroops = 50000000000000n;
      return { employees, treasuryBalanceStroops };
    },
    { refreshInterval: 2000 }
  );

  const handleClaim = async (emp: StoredEmployee) => {
    if (!walletAddress) {
      alert("Please connect Freighter wallet first.");
      return;
    }

    const isOwner = walletAddress.toLowerCase() === emp.wallet.toLowerCase();
    if (!isOwner) {
      alert(`Unauthorized: Only the stream owner (${emp.wallet.slice(0, 6)}...${emp.wallet.slice(-4)}) is authorized to claim accrued pay.`);
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
            <h1 className="text-2xl font-bold text-textPrimary tracking-tight">
              Treasury Dashboard Grid
            </h1>
            <p className="text-xs text-textSecondary mt-1">
              Real-time continuous salary streams powered by Soroban smart contracts.
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
                className="underline font-mono text-textPrimary hover:text-accentPrimary"
              >
                View Hash
              </a>
            )}
          </div>
        )}

        {/* Employee Cards Grid */}
        {!dashboardData || dashboardData.employees.length === 0 ? (
          <div className="surface-card p-12 text-center space-y-3 max-w-md mx-auto my-12">
            <LayoutDashboard className="w-10 h-10 text-accentPrimary mx-auto opacity-60" />
            <h3 className="text-base font-bold text-textPrimary">No Active Salary Streams Found</h3>
            <p className="text-xs text-textSecondary">
              There are currently no active employee salary streams registered. Ask your treasury admin to register an employee wallet in the Admin Panel to start streaming payouts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.employees.map((emp) => {
              const isUserWallet =
                walletAddress &&
                walletAddress.toLowerCase() === emp.wallet.toLowerCase();

              const isClaimDisabled = claimingId === emp.id || emp.paused || !isUserWallet;

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
                    disabled={isClaimDisabled}
                    className={`w-full py-3 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 ${
                      isClaimDisabled
                        ? "bg-bgSurfaceHover text-textSecondary cursor-not-allowed border border-borderSubtle"
                        : "bg-gradient-to-r from-accentPrimary to-[#e8c383] text-bgPrimary hover:opacity-90 shadow-md shadow-accentPrimary/10"
                    }`}
                  >
                    {!isUserWallet && !emp.paused ? (
                      <Lock className="w-4 h-4 text-textSecondary" />
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                    {claimingId === emp.id
                      ? "Submitting Claim TX..."
                      : emp.paused
                      ? "Stream Currently Paused"
                      : !isUserWallet
                      ? "Only Stream Owner Can Claim"
                      : "Claim Accrued Pay"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
