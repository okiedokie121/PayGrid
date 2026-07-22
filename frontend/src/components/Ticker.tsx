"use client";

import { useEffect, useState } from "react";
import { formatPayAmount } from "@/lib/math";

interface TickerProps {
  bankedStroops: bigint;
  rateStroops: bigint;
  lastUpdateSeconds: number;
  paused: boolean;
  treasuryBalanceStroops?: bigint;
  decimals?: number;
}

export default function Ticker({
  bankedStroops,
  rateStroops,
  lastUpdateSeconds,
  paused,
  treasuryBalanceStroops,
  decimals = 4,
}: TickerProps) {
  const [currentStroops, setCurrentStroops] = useState<bigint>(bankedStroops);

  useEffect(() => {
    const isPaused =
      paused ||
      rateStroops === 0n ||
      (treasuryBalanceStroops !== undefined && treasuryBalanceStroops <= 0n);

    if (isPaused) {
      setCurrentStroops(bankedStroops);
      return;
    }

    const interval = setInterval(() => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const elapsed = Math.max(0, nowSeconds - lastUpdateSeconds);
      const accrued = bankedStroops + BigInt(elapsed) * rateStroops;
      setCurrentStroops(accrued);
    }, 100); // Ticks 10 times a second for smooth live animation

    return () => clearInterval(interval);
  }, [bankedStroops, rateStroops, lastUpdateSeconds, paused, treasuryBalanceStroops]);

  return (
    <span className="font-mono tabular-nums text-accentPrimary font-bold">
      {formatPayAmount(currentStroops, decimals)}
    </span>
  );
}
