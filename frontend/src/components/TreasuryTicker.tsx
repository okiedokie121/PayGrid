"use client";

import { useEffect, useState } from "react";
import { formatPayAmount } from "@/lib/math";
import { StoredEmployee } from "@/lib/stellar";

interface TreasuryTickerProps {
  baseBalanceStroops: bigint;
  employees: StoredEmployee[];
  decimals?: number;
}

export default function TreasuryTicker({
  baseBalanceStroops,
  employees,
  decimals = 2,
}: TreasuryTickerProps) {
  const [currentBalance, setCurrentBalance] = useState<bigint>(baseBalanceStroops);

  useEffect(() => {
    const activeStreams = employees.filter((e) => e.active && !e.paused);
    
    if (activeStreams.length === 0) {
      setCurrentBalance(baseBalanceStroops);
      return;
    }

    const interval = setInterval(() => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      let totalOutflowStroops = 0n;

      for (const emp of activeStreams) {
        const elapsed = Math.max(0, nowSeconds - emp.lastUpdate);
        totalOutflowStroops += BigInt(elapsed) * BigInt(emp.ratePerSecond);
      }

      const remaining =
        baseBalanceStroops > totalOutflowStroops
          ? baseBalanceStroops - totalOutflowStroops
          : 0n;

      setCurrentBalance(remaining);
    }, 100); // Live tick every 100ms for smooth outflow animation

    return () => clearInterval(interval);
  }, [baseBalanceStroops, employees]);

  return (
    <span className="font-mono tabular-nums text-accentPrimary font-bold">
      {formatPayAmount(currentBalance, decimals)}
    </span>
  );
}
