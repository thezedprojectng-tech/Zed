export type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid" | "cancelled";

export interface ZedSettings {
  id: number;
  token_price_ngn: number;
  withdrawals_enabled: boolean;
  min_withdraw_zed: number;
  max_withdraw_zed: number;
  min_level: number;
  updated_at: string;
}

export interface PriceHistoryEntry {
  id: number;
  price_ngn: number;
  set_by: string | null;
  set_at: string;
  setter_name?: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount_zed: number;
  price_ngn_snapshot: number;
  amount_ngn: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: WithdrawalStatus;
  reject_reason: string | null;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  user_email?: string;
  user_name?: string;
}

export interface UserWithdrawalOverview {
  settings: ZedSettings;
  balanceZed: number;
  userLevel: number;
  isVerified: boolean;
  pendingRequest: WithdrawalRequest | null;
  requests: WithdrawalRequest[];
}
