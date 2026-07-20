export interface EmployeeInfo {
  id: number;
  wallet: string;
  name: string;
  active: boolean;
}

export interface StreamInfo {
  employee_id: number;
  rate_per_second: string; // BigInt represented as string
  last_update: number;
  accrued_unclaimed: string;
  paused: boolean;
}

export interface AccruedItem {
  employeeId: number;
  amount: string;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  xlmBalance: string;
  payBalance: string;
  hasPayTrustline: boolean;
  isAdmin: boolean;
}
