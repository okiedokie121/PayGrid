import * as freighter from "@stellar/freighter-api";
import {
  Horizon,
  TransactionBuilder,
  Operation,
  Asset,
} from "@stellar/stellar-sdk";
import {
  NETWORK_PASSPHRASE,
  ISSUER_ADDRESS,
} from "./constants";

export interface StoredEmployee {
  id: number;
  name: string;
  wallet: string;
  ratePerSecond: string;
  bankedAccrued: string;
  lastUpdate: number;
  paused: boolean;
  active: boolean;
}

export function getStoredEmployees(): StoredEmployee[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("paygrid_registered_employees");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveStoredEmployees(employees: StoredEmployee[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("paygrid_registered_employees", JSON.stringify(employees));
}

export function addStoredEmployee(name: string, wallet: string, customRatePerSec?: string): StoredEmployee[] {
  const current = getStoredEmployees();
  const rateStroops = customRatePerSec && parseFloat(customRatePerSec) > 0
    ? BigInt(Math.floor(parseFloat(customRatePerSec) * 10_000_000)).toString()
    : "25000000"; // default 2.5 PAY/sec

  const newEmp: StoredEmployee = {
    id: current.length + 1,
    name,
    wallet,
    ratePerSecond: rateStroops,
    bankedAccrued: "0",
    lastUpdate: Math.floor(Date.now() / 1000),
    paused: false,
    active: true,
  };
  const updated = [...current, newEmp];
  saveStoredEmployees(updated);
  return updated;
}

export function togglePauseStoredEmployee(id: number): StoredEmployee[] {
  const current = getStoredEmployees();
  const now = Math.floor(Date.now() / 1000);

  const updated = current.map((emp) => {
    if (emp.id !== id) return emp;

    const rateStroops = BigInt(emp.ratePerSecond);
    const bankedStroops = BigInt(emp.bankedAccrued || "0");
    const elapsed = Math.max(0, now - emp.lastUpdate);

    if (!emp.paused) {
      // Pausing stream: Freeze & bank all accrued pay up to `now`
      const newlyAccrued = BigInt(elapsed) * rateStroops;
      const totalBanked = bankedStroops + newlyAccrued;
      return {
        ...emp,
        bankedAccrued: totalBanked.toString(),
        lastUpdate: now,
        paused: true,
      };
    } else {
      // Resuming stream: Update lastUpdate to `now` so time elapses from this moment forward
      return {
        ...emp,
        lastUpdate: now,
        paused: false,
      };
    }
  });

  saveStoredEmployees(updated);
  return updated;
}

export function removeStoredEmployee(id: number): StoredEmployee[] {
  const current = getStoredEmployees();
  const updated = current.map((emp) =>
    emp.id === id ? { ...emp, active: false } : emp
  );
  saveStoredEmployees(updated);
  return updated;
}

export async function checkFreighterConnected(): Promise<boolean> {
  try {
    if (typeof window !== "undefined" && (window as any).freighter) {
      return true;
    }
    if (typeof freighter.isConnected === "function") {
      const res = await freighter.isConnected();
      if (typeof res === "boolean") return res;
      if (res && typeof res === "object") {
        return Boolean((res as any).isConnected);
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

export async function getConnectedWallet(promptUser = false): Promise<string | null> {
  try {
    const isConnected = await checkFreighterConnected();
    if (!isConnected) return null;

    // If promptUser is true, try requestAccess first to trigger the Freighter approval prompt
    if (promptUser) {
      if (typeof (freighter as any).requestAccess === "function") {
        try {
          const res = await (freighter as any).requestAccess();
          if (typeof res === "string" && res.length > 0) return res;
          if (res && typeof res.address === "string" && res.address.length > 0) {
            return res.address;
          }
        } catch (e) {
          console.warn("requestAccess error:", e);
        }
      }
      if (typeof window !== "undefined" && (window as any).freighter?.requestAccess) {
        try {
          const res = await (window as any).freighter.requestAccess();
          if (typeof res === "string" && res.length > 0) return res;
          if (res?.address) return res.address;
        } catch (e) {
          console.warn("window.freighter.requestAccess error:", e);
        }
      }
    }

    // Try getAddress
    if (typeof (freighter as any).getAddress === "function") {
      try {
        const res = await (freighter as any).getAddress();
        if (typeof res === "string" && res.length > 0) return res;
        if (res && typeof res.address === "string" && res.address.length > 0) {
          return res.address;
        }
      } catch (e) {
        console.warn("getAddress error:", e);
      }
    }

    // Try getPublicKey
    if (typeof (freighter as any).getPublicKey === "function") {
      try {
        const res = await (freighter as any).getPublicKey();
        if (typeof res === "string" && res.length > 0) return res;
        if (res && typeof res.publicKey === "string" && res.publicKey.length > 0) {
          return res.publicKey;
        }
      } catch (e) {
        console.warn("getPublicKey error:", e);
      }
    }

    // Fallback: window.freighter direct call
    if (typeof window !== "undefined" && (window as any).freighter) {
      const wFreighter = (window as any).freighter;
      try {
        if (promptUser && typeof wFreighter.requestAccess === "function") {
          const res = await wFreighter.requestAccess();
          if (typeof res === "string" && res.length > 0) return res;
          if (res?.address) return res.address;
        }
        if (typeof wFreighter.getAddress === "function") {
          const res = await wFreighter.getAddress();
          if (typeof res === "string" && res.length > 0) return res;
          if (res?.address) return res.address;
        }
        if (typeof wFreighter.getPublicKey === "function") {
          const res = await wFreighter.getPublicKey();
          if (typeof res === "string" && res.length > 0) return res;
          if (res?.publicKey) return res.publicKey;
        }
      } catch (e) {
        console.warn("window.freighter error:", e);
      }
    }

    return null;
  } catch (e) {
    console.error("Error in getConnectedWallet:", e);
    return null;
  }
}

export async function fetchWalletBalances(walletAddress: string): Promise<{ xlm: string; pay: string; rawXlm: number; rawPay: number }> {
  try {
    const server = new Horizon.Server("https://horizon-testnet.stellar.org");
    const account = await server.loadAccount(walletAddress);
    
    let rawXlm = 0;
    let rawPay = 0;

    for (const b of account.balances as any[]) {
      if (b.asset_type === "native") {
        rawXlm = parseFloat(b.balance);
      } else if (b.asset_code === "PAY") {
        rawPay = parseFloat(b.balance);
      }
    }

    // Add locally swapped PAY tokens if stored in localStorage
    if (typeof window !== "undefined" && walletAddress) {
      const storedPay = localStorage.getItem(`paygrid_pay_bal_${walletAddress.toLowerCase()}`);
      if (storedPay) {
        rawPay += parseFloat(storedPay);
      }
    }

    const xlm = rawXlm.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
    const pay = rawPay.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });

    return { xlm, pay, rawXlm, rawPay };
  } catch (e) {
    console.error("Failed to fetch wallet balances:", e);
    return { xlm: "0.00", pay: "0.00", rawXlm: 0, rawPay: 0 };
  }
}

export function getStoredTreasuryBalance(): bigint {
  if (typeof window === "undefined") return 0n;
  const val = localStorage.getItem("paygrid_treasury_balance_stroops");
  return val ? BigInt(val) : 0n;
}

export function addStoredTreasuryBalance(stroops: bigint): bigint {
  if (typeof window === "undefined") return 0n;
  const current = getStoredTreasuryBalance();
  const updated = current + stroops;
  localStorage.setItem("paygrid_treasury_balance_stroops", updated.toString());
  return updated;
}

export function addStoredUserPayBalance(walletAddress: string, amountPay: number) {
  if (typeof window === "undefined" || !walletAddress) return;
  const key = `paygrid_pay_bal_${walletAddress.toLowerCase()}`;
  const current = parseFloat(localStorage.getItem(key) || "0");
  const updated = current + amountPay;
  localStorage.setItem(key, updated.toString());
}

export async function checkPayTrustline(walletAddress: string): Promise<boolean> {
  try {
    const server = new Horizon.Server("https://horizon-testnet.stellar.org");
    const account = await server.loadAccount(walletAddress);
    const payAssetSymbol = "PAY";
    return account.balances.some((balance: any) => {
      return (
        balance.asset_type !== "native" &&
        balance.asset_code === payAssetSymbol &&
        (balance.asset_issuer === ISSUER_ADDRESS || !balance.asset_issuer)
      );
    });
  } catch (e) {
    return true;
  }
}

export async function establishPayTrustline(walletAddress: string): Promise<string> {
  const server = new Horizon.Server("https://horizon-testnet.stellar.org");
  const account = await server.loadAccount(walletAddress);

  const payAsset = new Asset("PAY", ISSUER_ADDRESS);

  const tx = new TransactionBuilder(account, {
    fee: "10000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.changeTrust({
        asset: payAsset,
        limit: "1000000000",
      })
    )
    .setTimeout(30)
    .build();

  const xdr = tx.toXDR();
  let signedXdr = xdr;
  if (typeof (freighter as any).signTransaction === "function") {
    const res = await (freighter as any).signTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    signedXdr = typeof res === "string" ? res : (res as any)?.signedTxXdr || xdr;
  }

  const txResult = await server.submitTransaction(
    TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
  );

  return txResult.hash;
}

export async function executeXlmToPaySwap(
  walletAddress: string,
  xlmAmount: string
): Promise<string> {
  const server = new Horizon.Server("https://horizon-testnet.stellar.org");
  const account = await server.loadAccount(walletAddress);

  const tx = new TransactionBuilder(account, {
    fee: "10000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: ISSUER_ADDRESS,
        asset: Asset.native(),
        amount: xlmAmount,
      })
    )
    .setTimeout(30)
    .build();

  const xdr = tx.toXDR();
  let signedXdr = xdr;

  if (typeof (freighter as any).signTransaction === "function") {
    const res = await (freighter as any).signTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    signedXdr = typeof res === "string" ? res : (res as any)?.signedTxXdr || xdr;
  }

  const txResult = await server.submitTransaction(
    TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
  );

  return txResult.hash;
}
