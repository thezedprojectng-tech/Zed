export type ReferralStatus = "pending" | "rewarded" | "capped" | "rejected";

export interface ReferralSettings {
  id: number;
  enabled: boolean;
  referrer_reward_zed: number;
  referee_reward_zed: number;
  max_rewarded_per_referrer: number;
  updated_at: string;
}

export interface ReferredUserEntry {
  id: string;
  masked_name: string;
  status: ReferralStatus;
  reward_earned: number;
  created_at: string;
  rewarded_at: string | null;
}

export interface UserReferralOverview {
  referralCode: string;
  referralLink: string;
  settings: ReferralSettings;
  stats: {
    totalInvited: number;
    totalRewarded: number;
    totalEarnedZed: number;
    pendingCount: number;
  };
  hasReferrer: boolean;
  isEligibleToEnterCode: boolean; // unverified, no referrer, account created <= 7 days
  referredUsers: ReferredUserEntry[];
}

export interface AdminReferralRecord {
  id: string;
  referrer_id: string;
  referrer_name: string;
  referrer_code: string;
  referred_id: string;
  referred_name: string;
  referred_verified: boolean;
  status: ReferralStatus;
  referrer_reward_zed: number;
  referee_reward_zed: number;
  created_at: string;
  rewarded_at: string | null;
}

export interface TopReferrerEntry {
  userId: string;
  name: string;
  code: string;
  totalInvites: number;
  rewardedCount: number;
  totalEarnedZed: number;
}

export interface AdminReferralStats {
  totalReferrals: number;
  totalRewarded: number;
  totalPending: number;
  totalCapped: number;
  totalZedPaid: number;
}

export interface AdminReferralData {
  settings: ReferralSettings;
  referrals: AdminReferralRecord[];
  stats: AdminReferralStats;
  topReferrers: TopReferrerEntry[];
}

export interface AdminReferralSettingsInput {
  enabled: boolean;
  referrer_reward_zed: number;
  referee_reward_zed: number;
  max_rewarded_per_referrer: number;
}
