"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { establishPayTrustline } from "@/lib/stellar";

interface TrustlineNoticeProps {
  walletAddress: string | null;
  hasTrustline: boolean;
  onTrustlineEstablished?: () => void;
}

export default function TrustlineNotice({
  walletAddress,
  hasTrustline,
  onTrustlineEstablished,
}: TrustlineNoticeProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!walletAddress || hasTrustline) {
    return null;
  }

  const handleEstablish = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const hash = await establishPayTrustline(walletAddress);
      setTxHash(hash);
      if (onTrustlineEstablished) onTrustlineEstablished();
    } catch (err: any) {
      console.error("Trustline establish error:", err);
      if (err?.message?.includes("User rejected")) {
        setErrorMsg("Transaction rejected in wallet");
      } else {
        setErrorMsg("Failed to establish trustline. Please ensure you have sufficient XLM fee.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-accentWarning/10 border border-accentWarning/30 rounded-2xl p-4 my-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accentWarning/20 text-accentWarning">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-textPrimary">
              Action Required: Missing PAY Trustline
            </h4>
            <p className="text-xs text-textSecondary mt-0.5">
              Your wallet hasn't established a trustline for the PAY SAC token. Claims and deposits will fail until trustline is enabled.
            </p>
          </div>
        </div>

        <button
          onClick={handleEstablish}
          disabled={isSubmitting}
          className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold bg-accentWarning hover:bg-accentWarning/90 text-bgPrimary transition shadow-md shadow-accentWarning/20 disabled:opacity-50 flex items-center gap-2"
        >
          <ShieldAlert className="w-4 h-4" />
          {isSubmitting ? "Submitting ChangeTrust..." : "Establish Trustline (1-Click)"}
        </button>
      </div>

      {txHash && (
        <div className="mt-3 p-2 bg-accentSuccess/10 border border-accentSuccess/20 rounded-xl flex items-center gap-2 text-xs text-accentSuccess">
          <CheckCircle className="w-4 h-4" />
          <span>Trustline established! Tx Hash: </span>
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="underline font-mono"
          >
            {txHash.slice(0, 8)}...{txHash.slice(-8)}
          </a>
        </div>
      )}

      {errorMsg && (
        <div className="mt-3 p-2 bg-accentDanger/10 border border-accentDanger/20 rounded-xl text-xs text-accentDanger font-medium">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
