"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Wallet, Shield, Layers, LayoutDashboard, ChevronRight, RefreshCw, Home } from "lucide-react";
import { getConnectedWallet, checkFreighterConnected } from "@/lib/stellar";

interface NavbarProps {
  onWalletStateChange?: (address: string | null) => void;
  adminAddress?: string | null;
}

export default function Navbar({ onWalletStateChange, adminAddress }: NavbarProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    getConnectedWallet().then((addr) => {
      if (addr) {
        setWalletAddress(addr);
        if (onWalletStateChange) onWalletStateChange(addr);
      }
    });
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const addr = await getConnectedWallet(true);
      if (addr) {
        setWalletAddress(addr);
        if (onWalletStateChange) onWalletStateChange(addr);
      } else {
        const isInstalled = await checkFreighterConnected();
        if (!isInstalled) {
          alert("Freighter extension not detected. Please install Freighter from https://www.freighter.app/");
        } else {
          alert("Wallet connection was cancelled or permission was denied in Freighter.");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    if (onWalletStateChange) onWalletStateChange(null);
  };

  const isAdmin =
    walletAddress &&
    adminAddress &&
    walletAddress.toLowerCase() === adminAddress.toLowerCase();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-bgPrimary/80 border-b border-borderSubtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accentPrimary to-[#e8c383] p-[1px] shadow-lg shadow-accentPrimary/10">
            <div className="w-full h-full bg-bgSurface rounded-[11px] flex items-center justify-center group-hover:bg-bgSurfaceHover transition">
              <Layers className="w-5 h-5 text-accentPrimary" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-textPrimary tracking-tight">PayGrid</span>
            </div>
            <p className="text-xs text-textSecondary hidden sm:block">Continuous Team Payroll</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-bgSurface p-1 rounded-xl border border-borderSubtle">
          <Link
            href="/"
            className="px-4 py-1.5 rounded-lg text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceHover transition flex items-center gap-1.5"
          >
            <Home className="w-4 h-4 text-accentPrimary" />
            Overview
          </Link>
          <Link
            href="/swap"
            className="px-4 py-1.5 rounded-lg text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceHover transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4 text-accentPrimary" />
            Swap
          </Link>
          <Link
            href="/admin"
            className="px-4 py-1.5 rounded-lg text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceHover transition flex items-center gap-1.5"
          >
            <Shield className="w-4 h-4 text-accentPrimary" />
            Admin Panel
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-1.5 rounded-lg text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-bgSurfaceHover transition flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-4 h-4 text-accentSecondary" />
            Dashboard
          </Link>
        </nav>

        {/* Wallet Connect Section */}
        <div className="flex items-center gap-3">
          {walletAddress ? (
            <div className="flex items-center gap-2 bg-bgSurface border border-borderSubtle rounded-xl p-1.5 pl-3">
              <div className="w-2 h-2 rounded-full bg-accentSuccess animate-pulse" />
              <span className="text-xs font-mono font-medium text-textPrimary">
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </span>
              <button
                onClick={handleDisconnect}
                className="text-xs px-2.5 py-1 rounded-lg bg-bgSurfaceHover hover:bg-accentDanger/20 text-textSecondary hover:text-accentDanger transition"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-bgPrimary bg-gradient-to-r from-accentPrimary to-[#e8c383] hover:opacity-90 transition shadow-lg shadow-accentPrimary/10 disabled:opacity-50"
            >
              <Wallet className="w-4 h-4" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
