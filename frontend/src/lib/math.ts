import { STROOPS_PER_TOKEN, SECONDS_PER_YEAR } from "./constants";

/**
 * Converts an annual salary (in standard token units, e.g., 120,000 PAY/yr)
 * to rate_per_second in stroops (1 PAY = 10,000,000 stroops).
 */
export function annualSalaryToStroopsPerSecond(annualSalary: number): bigint {
  if (annualSalary <= 0) return 0n;
  const stroopsPerYear = BigInt(Math.floor(annualSalary * 10_000_000));
  return stroopsPerYear / BigInt(SECONDS_PER_YEAR);
}

/**
 * Converts rate_per_second in stroops back to annual salary in PAY units.
 */
export function stroopsPerSecondToAnnualSalary(rateStroops: bigint): number {
  const annualStroops = rateStroops * BigInt(SECONDS_PER_YEAR);
  return Number(annualStroops) / 10_000_000;
}

/**
 * Formats a BigInt stroop amount into human readable PAY string (7 decimal places max).
 */
export function formatPayAmount(stroops: bigint, decimals: number = 4): string {
  const total = Number(stroops) / 10_000_000;
  return total.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Computes live accrued amount given banked amount, rate_per_second (stroops),
 * last update timestamp (seconds), current timestamp (seconds), and paused status.
 */
export function computeLiveAccrued(
  bankedStroops: bigint,
  rateStroops: bigint,
  lastUpdateSeconds: number,
  currentTimestampSeconds: number,
  paused: boolean,
  treasuryBalanceStroops?: bigint
): bigint {
  if (paused || (treasuryBalanceStroops !== undefined && treasuryBalanceStroops <= 0n)) {
    return bankedStroops;
  }
  const elapsed = Math.max(0, currentTimestampSeconds - lastUpdateSeconds);
  const newAccrual = BigInt(elapsed) * rateStroops;
  return bankedStroops + newAccrual;
}

/**
 * Calculates max claimable amount capping accrued at treasury balance.
 */
export function calculateClaimablePayout(accruedStroops: bigint, treasuryBalanceStroops: bigint): {
  claimable: bigint;
  isPartial: boolean;
  remainingBanked: bigint;
} {
  if (accruedStroops <= treasuryBalanceStroops) {
    return {
      claimable: accruedStroops,
      isPartial: false,
      remainingBanked: 0n,
    };
  } else {
    return {
      claimable: treasuryBalanceStroops,
      isPartial: true,
      remainingBanked: accruedStroops - treasuryBalanceStroops,
    };
  }
}
