import Link from "next/link";
import { Layers, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-borderSubtle bg-bgSurface/50 py-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accentPrimary/10 border border-accentPrimary/20 flex items-center justify-center">
            <Layers className="w-4 h-4 text-accentPrimary" />
          </div>
          <div>
            <span className="font-bold text-sm text-textPrimary">PayGrid Protocol</span>
            <p className="text-xs text-textSecondary"> Soroban Powered Team Treasury & Salary Streaming</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-textSecondary">
          <a
            href="https://stellar.expert/explorer/testnet/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-accentPrimary transition flex items-center gap-1"
          >
            Stellar Expert Testnet <ExternalLink className="w-3 h-3" />
          </a>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accentSuccess/10 text-accentSuccess border border-accentSuccess/20 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-accentSuccess animate-pulse" />
            Stellar Testnet (Protocol 22+)
          </span>
        </div>
      </div>
    </footer>
  );
}
