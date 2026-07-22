import { describe, it, expect } from "vitest";
import {
  annualSalaryToStroopsPerSecond,
  stroopsPerSecondToAnnualSalary,
  formatPayAmount,
  computeLiveAccrued,
  calculateClaimablePayout,
} from "../lib/math";

describe("Frontend Payroll Math & Accrual Engine", () => {
  it("converts annual salary to per-second stroop rate correctly", () => {
    // 31,536,000 PAY / year = 1 PAY / sec = 10,000,000 stroops / sec
    const rate = annualSalaryToStroopsPerSecond(31_536_000);
    expect(rate).toBe(10_000_000n);
  });

  it("converts per-second stroop rate back to annual salary", () => {
    const rateStroops = 10_000_000n;
    const salary = stroopsPerSecondToAnnualSalary(rateStroops);
    expect(salary).toBe(31_536_000);
  });

  it("formats stroop amounts into formatted string", () => {
    const stroops = 123456789n; // 12.3456789 PAY
    const formatted = formatPayAmount(stroops, 4);
    expect(formatted).toBe("12.3457");
  });

  it("computes live accrual given elapsed time and rate", () => {
    const banked = 1000n;
    const rate = 100n;
    const lastUpdate = 1000;
    const now = 1010; // 10 seconds elapsed
    const accrued = computeLiveAccrued(banked, rate, lastUpdate, now, false);
    expect(accrued).toBe(2000n);
  });

  it("freezes accrual when stream is paused", () => {
    const banked = 1000n;
    const rate = 100n;
    const lastUpdate = 1000;
    const now = 1050; // 50 seconds elapsed
    const accrued = computeLiveAccrued(banked, rate, lastUpdate, now, true); // paused
    expect(accrued).toBe(1000n);
  });

  it("freezes accrual when treasury balance is 0 PAY", () => {
    const banked = 1000n;
    const rate = 100n;
    const lastUpdate = 1000;
    const now = 1050;
    const accrued = computeLiveAccrued(banked, rate, lastUpdate, now, false, 0n);
    expect(accrued).toBe(1000n);
  });

  it("handles full claim when treasury balance is sufficient", () => {
    const accrued = 5000n;
    const treasuryBalance = 10000n;
    const payout = calculateClaimablePayout(accrued, treasuryBalance);
    expect(payout.claimable).toBe(5000n);
    expect(payout.isPartial).toBe(false);
    expect(payout.remainingBanked).toBe(0n);
  });

  it("caps claim at treasury balance when underfunded and banks remainder", () => {
    const accrued = 5000n;
    const treasuryBalance = 2000n; // Underfunded
    const payout = calculateClaimablePayout(accrued, treasuryBalance);
    expect(payout.claimable).toBe(2000n);
    expect(payout.isPartial).toBe(true);
    expect(payout.remainingBanked).toBe(3000n);
  });
});
