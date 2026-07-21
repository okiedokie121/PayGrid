"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrustlineNotice from "@/components/TrustlineNotice";
import { getConnectedWallet, checkPayTrustline } from "@/lib/stellar";
import {
  ArrowDown,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Settings,
} from "lucide-react";

export default function SwapPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [hasTrustline, setHasTrustline] = useState<boolean>(true);

  const [fromAmount, setFromAmount] = useState<string>("10");
  const [toAmount, setToAmount] = useState<string>("1000"); // 1 XLM = 100 PAY
  const [slippage, setSlippage] = useState<number>(0.5);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [txToast, setTxToast] = useState<{ msg: string; hash?: string } | null>(null);

  // Mocked balances for UI display
  const xlmBalance = "142.58";
  const payBalance = "2,500.00";
  const exchangeRate = 100; // 1 XLM = 100 PAY

  useEffect(() => {
    getConnectedWallet().then((addr) => {
      setWalletAddress(addr);
      if (addr) {
        checkPayTrustline(addr).then((ok) => setHasTrustline(ok));
      }
    });
  }, []);

  const handleFromAmountChange = (val: string) => {
    setFromAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setToAmount((num * exchangeRate).toFixed(2));
    } else {
      setToAmount("0");
    }
  };

  const handleSetMax = () => {
    const maxVal = Math.max(0, parseFloat(xlmBalance) - 2); // keep 2 XLM for reserve/fees
    handleFromAmountChange(maxVal.toString());
  };

  const handleExecuteSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) {
      alert("Please connect your Freighter wallet first.");
      return;
    }

    if (!hasTrustline) {
      alert("Please establish PAY trustline before swapping.");
      return;
    }

    setIsSwapping(true);
    setTxToast(null);

    try {
      // Execute swap transaction feedback
      await new Promise((r) => setTimeout(r, 1600));
      const simulatedHash = "5f0446fb02899fae555148bd6a850e11cfb945339033b821054461fd73c9fcbf";
      setTxToast({
        msg: `Swapped ${fromAmount} XLM for ${toAmount} PAY successfully!`,
        hash: simulatedHash,
      });
    } catch (err) {
      console.error(err);
      setTxToast({ msg: "Swap transaction failed or rejected." });
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-bgPrimary">
      <Navbar onWalletStateChange={setWalletAddress} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex flex-col items-center">
        {/* Page Title */}
        <div className="text-center max-w-md mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accentPrimary/10 border border-accentPrimary/20 text-accentPrimary text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" /> Instant Asset Converter
          </div>
          <h1 className="text-3xl font-extrabold text-textPrimary tracking-tight">
            Swap XLM to PAY
          </h1>
          <p className="text-xs text-textSecondary">
            Convert native Stellar XLM into PAY Treasury tokens instantly for continuous payroll funding.
          </p>
        </div>

        {/* Trustline Prompt */}
        <div className="w-full max-w-md">
          <TrustlineNotice
            walletAddress={walletAddress}
            hasTrustline={hasTrustline}
            onTrustlineEstablished={() => setHasTrustline(true)}
          />
        </div>

        {/* Success Toast */}
        {txToast && (
          <div className="w-full max-w-md mb-6 p-4 rounded-2xl bg-accentSuccess/10 border border-accentSuccess/30 text-xs text-accentSuccess flex items-center justify-between">
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
                Hash <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Swap Card */}
        <div className="w-full max-w-md surface-card p-6 space-y-4 shadow-2xl relative">
          <div className="flex items-center justify-between text-xs text-textSecondary border-b border-borderSubtle pb-3">
            <span className="font-semibold text-textPrimary">Swap Parameters</span>
            <div className="flex items-center gap-1 text-[11px]">
              <span>Slippage:</span>
              {[0.5, 1.0, 2.0].map((s) => (
                <button
                  key={s}
                  onClick={() => setSlippage(s)}
                  className={`px-2 py-0.5 rounded ${
                    slippage === s
                      ? "bg-accentPrimary text-bgPrimary font-bold"
                      : "bg-bgSurfaceHover text-textSecondary hover:text-textPrimary"
                  }`}
                >
                  {s}%
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleExecuteSwap} className="space-y-4">
            {/* From Asset (XLM) */}
            <div className="bg-bgPrimary/80 p-4 rounded-xl border border-borderSubtle space-y-2">
              <div className="flex justify-between text-xs text-textSecondary">
                <span>You Pay</span>
                <span>Balance: {xlmBalance} XLM</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  placeholder="0.0"
                  min="0.1"
                  step="any"
                  className="w-full bg-transparent text-2xl font-bold text-textPrimary font-mono focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSetMax}
                    className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-accentPrimary/10 text-accentPrimary border border-accentPrimary/20 hover:bg-accentPrimary/20 transition"
                  >
                    MAX
                  </button>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bgSurface border border-borderSubtle text-sm font-bold text-textPrimary">
                    <span className="w-4 h-4 rounded-full bg-accentSecondary/20 text-accentSecondary flex items-center justify-center text-[10px]">
                      ★
                    </span>
                    XLM
                  </div>
                </div>
              </div>
            </div>

            {/* Swap Direction Divider Icon */}
            <div className="flex justify-center -my-2 relative z-10">
              <div className="w-8 h-8 rounded-full bg-bgSurface border border-borderSubtle flex items-center justify-center text-accentPrimary shadow-md">
                <ArrowDown className="w-4 h-4" />
              </div>
            </div>

            {/* To Asset (PAY) */}
            <div className="bg-bgPrimary/80 p-4 rounded-xl border border-borderSubtle space-y-2">
              <div className="flex justify-between text-xs text-textSecondary">
                <span>You Receive (Estimated)</span>
                <span>Balance: {payBalance} PAY</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <input
                  type="number"
                  value={toAmount}
                  readOnly
                  placeholder="0.0"
                  className="w-full bg-transparent text-2xl font-bold text-accentPrimary font-mono focus:outline-none"
                />
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bgSurface border border-borderSubtle text-sm font-bold text-textPrimary">
                  <span className="w-4 h-4 rounded-full bg-accentPrimary/20 text-accentPrimary flex items-center justify-center text-[10px]">
                    $
                  </span>
                  PAY
                </div>
              </div>
            </div>

            {/* Exchange Rate Info */}
            <div className="p-3 bg-bgSurfaceHover/50 rounded-xl border border-borderSubtle/50 space-y-1 text-xs">
              <div className="flex justify-between text-textSecondary">
                <span>Exchange Rate</span>
                <span className="font-mono text-textPrimary font-semibold">1 XLM = 100 PAY</span>
              </div>
              <div className="flex justify-between text-textSecondary">
                <span>Minimum Received</span>
                <span className="font-mono text-textPrimary">
                  {(parseFloat(toAmount || "0") * (1 - slippage / 100)).toFixed(2)} PAY
                </span>
              </div>
            </div>

            {/* Execute Swap Button */}
            <button
              type="submit"
              disabled={isSwapping || !fromAmount || parseFloat(fromAmount) <= 0}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-accentPrimary to-[#e8c383] text-bgPrimary hover:opacity-90 transition shadow-lg shadow-accentPrimary/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSwapping ? "animate-spin" : ""}`} />
              {isSwapping ? "Executing Swap on Soroban..." : "Swap XLM to PAY"}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
