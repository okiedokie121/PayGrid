"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrustlineNotice from "@/components/TrustlineNotice";
import { getConnectedWallet, checkPayTrustline } from "@/lib/stellar";
import { annualSalaryToStroopsPerSecond, formatPayAmount } from "@/lib/math";
import {
  Shield,
  PlusCircle,
  UserCheck,
  UserX,
  PauseCircle,
  PlayCircle,
  Coins,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";

interface AdminEmployeeItem {
  id: number;
  name: string;
  wallet: string;
  ratePerSecond: string;
  paused: boolean;
  active: boolean;
}

export default function AdminPanel() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [hasTrustline, setHasTrustline] = useState<boolean>(true);
  const [fundAmount, setFundAmount] = useState<string>("100000");
  const [newEmpName, setNewEmpName] = useState<string>("");
  const [newEmpWallet, setNewEmpWallet] = useState<string>("");

  const [selectedEmpId, setSelectedEmpId] = useState<number>(1);
  const [annualSalaryInput, setAnnualSalaryInput] = useState<string>("120000");
  const [streamRateInput, setStreamRateInput] = useState<string>("10"); // 10 PAY/sec

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toast, setToast] = useState<{ msg: string; hash?: string } | null>(null);

  // Mocked/Fetched state
  const [treasuryBalance, setTreasuryBalance] = useState<bigint>(50000000000000n); // 5,000,000 PAY
  const [employees, setEmployees] = useState<AdminEmployeeItem[]>([
    {
      id: 1,
      name: "Alice Vance",
      wallet: "GDIJJBF4L2CWMNMXRNECQPLFOHUTSEUPUDIAHBOA4X2ISUU7MTSHL7SN",
      ratePerSecond: "100000000", // 10 PAY/sec
      paused: false,
      active: true,
    },
    {
      id: 2,
      name: "Bob Builder",
      wallet: "GBB3Y6OPO4WXYZEXAMPLEBOBADDRESS56CHARACTERSLONG02",
      ratePerSecond: "50000000", // 5 PAY/sec
      paused: false,
      active: true,
    },
    {
      id: 3,
      name: "Carol Danvers",
      wallet: "GCA3Y6OPO4WXYZEXAMPLECAROLADDRESS56CHARACTERSLONG3",
      ratePerSecond: "20000000", // 2 PAY/sec
      paused: true,
      active: true,
    },
  ]);

  useEffect(() => {
    getConnectedWallet().then((addr) => {
      setWalletAddress(addr);
      if (addr) {
        checkPayTrustline(addr).then((ok) => setHasTrustline(ok));
      }
    });
  }, []);

  const handleFundTreasury = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setToast(null);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const addedStroops = BigInt(Math.floor(Number(fundAmount) * 10_000_000));
      setTreasuryBalance((prev) => prev + addedStroops);
      setToast({
        msg: `Successfully funded Treasury with ${fundAmount} PAY!`,
        hash: "3980545ff656a9a57a29c43b493d8761aedd8b6a53583f5c35e3917ed200d236",
      });
    } catch (err: any) {
      console.error(err);
      setToast({ msg: "Failed to fund treasury." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName || !newEmpWallet) return;
    setIsSubmitting(true);
    setToast(null);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const newId = employees.length + 1;
      setEmployees((prev) => [
        ...prev,
        {
          id: newId,
          name: newEmpName,
          wallet: newEmpWallet,
          ratePerSecond: "100000000", // 10 PAY/sec
          paused: false,
          active: true,
        },
      ]);
      setToast({
        msg: `Employee ${newEmpName} added to registry successfully!`,
        hash: "06d4ab14be43956f0a43e4e1a80eb468082ffd8f5f7f13dab3d1ffe08ebfd83b",
      });
      setNewEmpName("");
      setNewEmpWallet("");
    } catch (err) {
      console.error(err);
      setToast({ msg: "Failed to add employee." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePause = async (empId: number) => {
    setIsSubmitting(true);
    setToast(null);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === empId ? { ...emp, paused: !emp.paused } : emp
        )
      );
      const emp = employees.find((e) => e.id === empId);
      setToast({
        msg: `Stream ${emp?.paused ? "resumed" : "paused"} for ${emp?.name}!`,
        hash: "1a7921f827a6002b96d49f402b32cd9d62065aa70a020659c5aceb7c6de1e042",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveEmployee = async (empId: number) => {
    if (!confirm("Are you sure you want to remove this employee from registry?")) return;
    setIsSubmitting(true);
    setToast(null);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === empId ? { ...emp, active: false } : emp
        )
      );
      setToast({
        msg: `Employee ID ${empId} removed from active registry. Halts claims immediately.`,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-bgPrimary">
      <Navbar onWalletStateChange={setWalletAddress} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-borderSubtle pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-accentPrimary" />
              <h1 className="text-2xl font-bold text-textPrimary tracking-tight">
                Admin Treasury Control Panel
              </h1>
            </div>
            <p className="text-xs text-textSecondary mt-1">
              Fund treasury balances, manage employee registry, adjust stream rates, and pause/resume payouts.
            </p>
          </div>

          <div className="bg-bgSurface border border-borderSubtle rounded-2xl px-5 py-3">
            <span className="text-xs text-textSecondary uppercase font-medium block">
              Treasury Contract Balance
            </span>
            <span className="text-xl font-extrabold text-accentPrimary font-mono">
              {formatPayAmount(treasuryBalance, 2)} PAY
            </span>
          </div>
        </div>

        <TrustlineNotice
          walletAddress={walletAddress}
          hasTrustline={hasTrustline}
          onTrustlineEstablished={() => setHasTrustline(true)}
        />

        {toast && (
          <div className="mb-6 p-4 rounded-2xl bg-accentSuccess/10 border border-accentSuccess/30 text-xs text-accentSuccess flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>{toast.msg}</span>
            </div>
            {toast.hash && (
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${toast.hash}`}
                target="_blank"
                rel="noreferrer"
                className="underline font-mono text-textPrimary hover:text-accentPrimary"
              >
                View Hash
              </a>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Management Forms */}
          <div className="space-y-6">
            {/* Fund Treasury Form */}
            <div className="surface-card p-6 space-y-4">
              <div className="flex items-center gap-2 text-textPrimary font-bold text-base">
                <Coins className="w-5 h-5 text-accentPrimary" />
                <h3>Fund Treasury Pool</h3>
              </div>
              <form onSubmit={handleFundTreasury} className="space-y-3">
                <div>
                  <label className="text-xs text-textSecondary block mb-1">
                    Amount to Deposit (PAY)
                  </label>
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    min="1"
                    className="w-full bg-bgPrimary border border-borderSubtle rounded-xl px-3 py-2 text-sm text-textPrimary focus:outline-none focus:border-accentPrimary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accentPrimary to-[#e8c383] text-bgPrimary font-semibold text-xs shadow-md hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? "Funding..." : "Fund Treasury (SAC Transfer)"}
                </button>
              </form>
            </div>

            {/* Add Employee Form */}
            <div className="surface-card p-6 space-y-4">
              <div className="flex items-center gap-2 text-textPrimary font-bold text-base">
                <PlusCircle className="w-5 h-5 text-accentSecondary" />
                <h3>Add Employee to Registry</h3>
              </div>
              <form onSubmit={handleAddEmployee} className="space-y-3">
                <div>
                  <label className="text-xs text-textSecondary block mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Alice Vance"
                    value={newEmpName}
                    onChange={(e) => setNewEmpName(e.target.value)}
                    className="w-full bg-bgPrimary border border-borderSubtle rounded-xl px-3 py-2 text-sm text-textPrimary focus:outline-none focus:border-accentSecondary"
                  />
                </div>
                <div>
                  <label className="text-xs text-textSecondary block mb-1">
                    Stellar Wallet Address
                  </label>
                  <input
                    type="text"
                    placeholder="G..."
                    value={newEmpWallet}
                    onChange={(e) => setNewEmpWallet(e.target.value)}
                    className="w-full bg-bgPrimary border border-borderSubtle rounded-xl px-3 py-2 text-sm text-textPrimary font-mono focus:outline-none focus:border-accentSecondary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !newEmpName || !newEmpWallet}
                  className="w-full py-2.5 rounded-xl bg-accentSecondary text-bgPrimary font-semibold text-xs shadow-md hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? "Adding..." : "Add Employee (`add_employee`)"}
                </button>
              </form>
            </div>
          </div>

          {/* Right 2 Columns: Employee List & Stream Control */}
          <div className="lg:col-span-2 space-y-6">
            <div className="surface-card p-6 space-y-4">
              <h3 className="font-bold text-lg text-textPrimary">
                Active Employee Roster & Stream Management
              </h3>

              <div className="space-y-3">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="bg-bgPrimary/60 p-4 rounded-xl border border-borderSubtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-textPrimary">{emp.name}</span>
                        <span className="text-xs text-textSecondary font-mono">
                          #{emp.id}
                        </span>
                        {!emp.active && (
                          <span className="px-2 py-0.5 rounded-full bg-accentDanger/10 text-accentDanger text-[10px] font-bold">
                            Removed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-textSecondary font-mono mt-0.5">
                        {emp.wallet}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Pause / Resume Button */}
                      <button
                        onClick={() => handleTogglePause(emp.id)}
                        disabled={isSubmitting || !emp.active}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                          emp.paused
                            ? "bg-accentSuccess/10 text-accentSuccess border border-accentSuccess/30 hover:bg-accentSuccess/20"
                            : "bg-accentWarning/10 text-accentWarning border border-accentWarning/30 hover:bg-accentWarning/20"
                        }`}
                      >
                        {emp.paused ? (
                          <>
                            <PlayCircle className="w-4 h-4" /> Resume Stream
                          </>
                        ) : (
                          <>
                            <PauseCircle className="w-4 h-4" /> Pause Stream
                          </>
                        )}
                      </button>

                      {/* Remove Employee Button */}
                      {emp.active && (
                        <button
                          onClick={() => handleRemoveEmployee(emp.id)}
                          disabled={isSubmitting}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-accentDanger/10 text-accentDanger border border-accentDanger/30 hover:bg-accentDanger/20 transition flex items-center gap-1.5"
                        >
                          <UserX className="w-4 h-4" /> Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
