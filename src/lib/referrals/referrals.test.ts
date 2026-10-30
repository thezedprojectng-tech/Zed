import { describe, it, expect } from "vitest";
import {
  APP_URL,
  maskUserName,
  formatReferralLink,
  ensureAbsoluteLink,
  buildWhatsAppShareUrl,
  mapReferralError,
} from "./helpers";
import {
  applyReferralSchema,
  adminReferralSettingsSchema,
} from "./validation";
import type { ReferralStatus } from "./types";

describe("Referrals — Code Format & Helpers", () => {
  it("formats referral links correctly with /signup?ref=CODE", () => {
    const origin = "https://zedproject.ng";
    const code = "7K9M2P4X";
    const link = formatReferralLink(origin, code);
    expect(link).toBe("https://zedproject.ng/signup?ref=7K9M2P4X");
  });

  it("handles trailing slashes on origin when formatting link", () => {
    const origin = "https://zedproject.ng/";
    const code = "7K9M2P4X";
    const link = formatReferralLink(origin, code);
    expect(link).toBe("https://zedproject.ng/signup?ref=7K9M2P4X");
  });

  it("formats referral link with absolute server-style call", () => {
    const code = "7K9M2P4X";
    const link = formatReferralLink(APP_URL, code);
    expect(link).toBe(`${APP_URL}/signup?ref=7K9M2P4X`);
  });

  it("builds WhatsApp share URL with the invite link and user wording", () => {
    const url = buildWhatsAppShareUrl("https://zedproject.ng/signup?ref=7K9M2P4X", "7K9M2P4X");
    expect(url).toContain("https://api.whatsapp.com/send?text=");
    expect(url).toContain(encodeURIComponent("7K9M2P4X"));
    expect(url).toContain(encodeURIComponent("https://zedproject.ng/signup?ref=7K9M2P4X"));
    expect(url).toContain(
      encodeURIComponent(
        "Join me on Zed! Use my invite link to create your account and earn bonus ZED points: https://zedproject.ng/signup?ref=7K9M2P4X"
      )
    );
    expect(decodeURIComponent(url)).not.toContain("once verified");
    // Ensure "citizen" is never included in the share copy
    expect(url.toLowerCase()).not.toContain("citizen");
  });
});

describe("Referrals — ensureAbsoluteLink", () => {
  it("converts relative link to absolute link", () => {
    const relative = "/signup?ref=7K9M2P4X";
    expect(ensureAbsoluteLink(relative)).toBe(`${APP_URL}/signup?ref=7K9M2P4X`);
  });

  it("leaves already absolute link unchanged", () => {
    const existing = "https://zedproject.ng/signup?ref=7K9M2P4X";
    expect(ensureAbsoluteLink(existing)).toBe(existing);
  });
});

describe("Referrals — Privacy Name Masking", () => {
  it("masks first and last names as 'First L.'", () => {
    expect(maskUserName("Babatunde Adeleke")).toBe("Babatunde A.");
    expect(maskUserName("Chioma Okonkwo")).toBe("Chioma O.");
    expect(maskUserName("Zayd Tahir")).toBe("Zayd T.");
  });

  it("handles single-word names without adding punctuation", () => {
    expect(maskUserName("Emeka")).toBe("Emeka");
  });

  it("uses the last word initial when multiple names are provided", () => {
    expect(maskUserName("Mary Jane Watson")).toBe("Mary W.");
  });

  it("returns fallback for null, undefined, or empty names", () => {
    expect(maskUserName(null)).toBe("User");
    expect(maskUserName(undefined)).toBe("User");
    expect(maskUserName("")).toBe("User");
    expect(maskUserName("   ")).toBe("User");
    // Ensure "citizen" is never used as fallback
    expect(maskUserName(null).toLowerCase()).not.toContain("citizen");
  });
});

describe("Referrals — Error Code Mapping", () => {
  it("maps all SQL RPC error codes to safe user-friendly messages", () => {
    expect(mapReferralError("CODE_NOT_FOUND")).toBe(
      "This referral code does not exist. Please check and try again."
    );
    expect(mapReferralError("SELF_REFERRAL")).toBe(
      "You cannot refer your own account."
    );
    expect(mapReferralError("ALREADY_REFERRED")).toBe(
      "You have already been referred by someone."
    );
    expect(mapReferralError("ALREADY_VERIFIED")).toBe(
      "This account is already verified and can no longer link a referral code."
    );
    expect(mapReferralError("ACCOUNT_TOO_OLD")).toBe(
      "Referral codes must be applied within 7 days of registration."
    );
  });

  it("falls back to generic error message for unknown error strings", () => {
    const fallback = mapReferralError("UNKNOWN_DATABASE_FAILURE");
    expect(fallback).toBe("Could not apply referral code. Please try again.");
  });

  it("does not leak database tables or citizens in error messages", () => {
    const codes = ["CODE_NOT_FOUND", "SELF_REFERRAL", "ALREADY_REFERRED", "ALREADY_VERIFIED", "ACCOUNT_TOO_OLD"];
    for (const code of codes) {
      const msg = mapReferralError(code).toLowerCase();
      expect(msg).not.toContain("citizen");
      expect(msg).not.toContain("sql");
      expect(msg).not.toContain("table");
      expect(msg).not.toContain("column");
    }
  });
});

describe("Referrals — Validation Schemas", () => {
  it("validates valid referral codes and normalizes uppercase", () => {
    const valid1 = applyReferralSchema.safeParse({ code: "7k9m2p4x" });
    expect(valid1.success).toBe(true);
    if (valid1.success) {
      expect(valid1.data.code).toBe("7K9M2P4X");
    }

    const valid2 = applyReferralSchema.safeParse({ code: "  ABCDEFGH  " });
    expect(valid2.success).toBe(true);
    if (valid2.success) {
      expect(valid2.data.code).toBe("ABCDEFGH");
    }
  });

  it("rejects codes that are too short or too long or invalid characters", () => {
    expect(applyReferralSchema.safeParse({ code: "" }).success).toBe(false);
    expect(applyReferralSchema.safeParse({ code: "AB" }).success).toBe(false);
    expect(applyReferralSchema.safeParse({ code: "TOOLONGFORREFERRALCODE123" }).success).toBe(false);
    expect(applyReferralSchema.safeParse({ code: "ABC!@#$%" }).success).toBe(false);
  });

  it("validates admin settings schema with proper types and positive bounds", () => {
    const valid = adminReferralSettingsSchema.safeParse({
      enabled: true,
      referrer_reward_zed: 100,
      referee_reward_zed: 50,
      max_rewarded_per_referrer: 50,
    });
    expect(valid.success).toBe(true);

    // Negative rewards must fail
    expect(
      adminReferralSettingsSchema.safeParse({
        enabled: true,
        referrer_reward_zed: -10,
        referee_reward_zed: 50,
        max_rewarded_per_referrer: 50,
      }).success
    ).toBe(false);

    // Negative cap must fail
    expect(
      adminReferralSettingsSchema.safeParse({
        enabled: true,
        referrer_reward_zed: 100,
        referee_reward_zed: 50,
        max_rewarded_per_referrer: -1,
      }).success
    ).toBe(false);

    // Rewards > 10,000 must fail
    expect(
      adminReferralSettingsSchema.safeParse({
        enabled: true,
        referrer_reward_zed: 10001,
        referee_reward_zed: 50,
        max_rewarded_per_referrer: 50,
      }).success
    ).toBe(false);

    // Max rewarded referrals > 1,000 must fail
    expect(
      adminReferralSettingsSchema.safeParse({
        enabled: true,
        referrer_reward_zed: 100,
        referee_reward_zed: 50,
        max_rewarded_per_referrer: 1001,
      }).success
    ).toBe(false);
  });
});

describe("Referrals — Reward Calculation & Cap Logic", () => {
  function simulateReferralRewardDecision(params: {
    enabled: boolean;
    currentRewardedCount: number;
    maxRewardedPerReferrer: number;
    referrerReward: number;
    refereeReward: number;
  }): {
    status: ReferralStatus;
    referrerRewardPaid: number;
    refereeRewardPaid: number;
  } {
    if (!params.enabled) {
      return { status: "pending", referrerRewardPaid: 0, refereeRewardPaid: 0 };
    }

    if (params.currentRewardedCount >= params.maxRewardedPerReferrer) {
      // Exceeded cap: marked capped, no referrer reward, but referee still gets welcome reward
      return {
        status: "capped",
        referrerRewardPaid: 0,
        refereeRewardPaid: params.refereeReward,
      };
    }

    return {
      status: "rewarded",
      referrerRewardPaid: params.referrerReward,
      refereeRewardPaid: params.refereeReward,
    };
  }

  it("leaves status pending if program is disabled", () => {
    const res = simulateReferralRewardDecision({
      enabled: false,
      currentRewardedCount: 10,
      maxRewardedPerReferrer: 50,
      referrerReward: 100,
      refereeReward: 50,
    });
    expect(res.status).toBe("pending");
    expect(res.referrerRewardPaid).toBe(0);
  });

  it("pays full rewards when under the max cap", () => {
    const res = simulateReferralRewardDecision({
      enabled: true,
      currentRewardedCount: 49,
      maxRewardedPerReferrer: 50,
      referrerReward: 100,
      refereeReward: 50,
    });
    expect(res.status).toBe("rewarded");
    expect(res.referrerRewardPaid).toBe(100);
    expect(res.refereeRewardPaid).toBe(50);
  });

  it("marks as capped when at or above the max cap (e.g. 50th reached)", () => {
    const res = simulateReferralRewardDecision({
      enabled: true,
      currentRewardedCount: 50,
      maxRewardedPerReferrer: 50,
      referrerReward: 100,
      refereeReward: 50,
    });
    expect(res.status).toBe("capped");
    expect(res.referrerRewardPaid).toBe(0);
    expect(res.refereeRewardPaid).toBe(50);
  });
});
