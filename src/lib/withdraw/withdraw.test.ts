import { describe, it, expect } from "vitest";
import {
  calculateNairaAmount,
  isAllowedStatusTransition,
  maskAccountNumber,
  mapWithdrawalError,
  mergeWithdrawalsWithUsers,
} from "./helpers";
import {
  withdrawalRequestSchema,
  adminSettingsSchema,
  adminReviewSchema,
} from "./validation";

describe("Zed Withdrawals - Naira Calculation", () => {
  it("calculates exact naira conversion rounded to 2 decimal places", () => {
    // 1,000 ZED at 15.5 NGN/ZED = 15,500.00
    expect(calculateNairaAmount(1000, 15.5)).toBe(15500);

    // 1,234.56 ZED at 12.3456 NGN/ZED = 15241.38
    expect(calculateNairaAmount(1234.56, 12.3456)).toBe(15241.38);

    // Rounding check
    expect(calculateNairaAmount(10, 0.33333)).toBe(3.33);
    expect(calculateNairaAmount(10, 0.33666)).toBe(3.37);
  });

  it("returns 0 for negative or zero amounts or price", () => {
    expect(calculateNairaAmount(0, 15)).toBe(0);
    expect(calculateNairaAmount(1000, 0)).toBe(0);
    expect(calculateNairaAmount(-500, 15)).toBe(0);
    expect(calculateNairaAmount(1000, -10)).toBe(0);
  });
});

describe("Zed Withdrawals - Status Transitions", () => {
  it("allows legal transitions from pending", () => {
    expect(isAllowedStatusTransition("pending", "approved")).toBe(true);
    expect(isAllowedStatusTransition("pending", "rejected")).toBe(true);
    expect(isAllowedStatusTransition("pending", "cancelled")).toBe(true);
    expect(isAllowedStatusTransition("pending", "paid")).toBe(false);
  });

  it("allows legal transitions from approved", () => {
    expect(isAllowedStatusTransition("approved", "paid")).toBe(true);
    expect(isAllowedStatusTransition("approved", "rejected")).toBe(true);
    expect(isAllowedStatusTransition("approved", "cancelled")).toBe(false);
    expect(isAllowedStatusTransition("approved", "pending")).toBe(false);
  });

  it("forbids transitions from terminal states", () => {
    const terminalStates = ["paid", "rejected", "cancelled"];
    const targets = ["pending", "approved", "paid", "rejected", "cancelled"];

    for (const term of terminalStates) {
      for (const target of targets) {
        expect(isAllowedStatusTransition(term, target)).toBe(false);
      }
    }
  });
});

describe("Zed Withdrawals - Account Number Masking", () => {
  it("masks 10-digit account numbers showing only the last 4 digits", () => {
    expect(maskAccountNumber("0123456789")).toBe("•••• •••• 6789");
    expect(maskAccountNumber("2087654321")).toBe("•••• •••• 4321");
  });

  it("cleans whitespace before masking", () => {
    expect(maskAccountNumber("012 345 6789")).toBe("•••• •••• 6789");
  });

  it("handles short or empty inputs gracefully", () => {
    expect(maskAccountNumber("")).toBe("•••• •••• ••••");
    expect(maskAccountNumber("12")).toBe("••••");
  });
});

describe("Zed Withdrawals - Error Mapping", () => {
  it("maps authentication errors to friendly message", () => {
    expect(mapWithdrawalError("User is not authenticated")).toBe(
      "Please sign in again."
    );
  });

  it("maps verification requirement errors", () => {
    expect(
      mapWithdrawalError("User must be verified to request a withdrawal")
    ).toBe("You must verify your NIN before you can withdraw ZED.");
  });

  it("maps disabled withdrawals error", () => {
    expect(
      mapWithdrawalError("Withdrawals are currently disabled by administration")
    ).toBe("Withdrawals are currently closed. Please check back later.");
  });

  it("maps level requirement errors", () => {
    expect(
      mapWithdrawalError("Minimum level 2 is required to withdraw")
    ).toBe("Your current mining level is not yet eligible to withdraw.");
  });

  it("maps limit errors with dynamic amount matching", () => {
    expect(
      mapWithdrawalError("Minimum withdrawal is 1000 ZED")
    ).toBe("Minimum withdrawal is 1000 ZED.");
    expect(
      mapWithdrawalError("Maximum withdrawal is 50000 ZED")
    ).toBe("Maximum withdrawal is 50000 ZED.");
  });

  it("maps single pending request conflict error", () => {
    expect(
      mapWithdrawalError("You already have a pending withdrawal request in review")
    ).toBe("You already have a pending withdrawal request in review.");
  });

  it("maps insufficient balance error", () => {
    expect(
      mapWithdrawalError("Insufficient ZED balance for withdrawal")
    ).toBe("Insufficient ZED balance in your wallet.");
  });

  it("maps self-approval attempt error", () => {
    expect(
      mapWithdrawalError("Admins cannot review their own withdrawal request")
    ).toBe("Admins cannot review their own withdrawal request.");
  });

  it("maps rejection reason requirement error", () => {
    expect(
      mapWithdrawalError("A rejection reason of at least 3 characters is required")
    ).toBe("A valid rejection reason of at least 3 characters is required.");
  });

  it("falls back to generic safe message for unknown internal SQL errors", () => {
    const rawSqlError = "ERROR: 23505: duplicate key value violates unique constraint 'idx_foo'";
    expect(mapWithdrawalError(rawSqlError)).toBe(
      "Could not process withdrawal. Please try again."
    );
  });
});

describe("Zed Withdrawals - Zod Schemas Validation", () => {
  it("validates valid withdrawal request input", () => {
    const valid = {
      amount_zed: 2500,
      bank_name: "Guaranty Trust Bank",
      account_number: "0123456789",
      account_name: "Zayd Tahir",
    };
    const res = withdrawalRequestSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("rejects invalid account numbers (must be exactly 10 digits)", () => {
    const tooShort = {
      amount_zed: 2500,
      bank_name: "GTBank",
      account_number: "123456789", // 9 digits
      account_name: "Zayd Tahir",
    };
    expect(withdrawalRequestSchema.safeParse(tooShort).success).toBe(false);

    const nonDigits = {
      amount_zed: 2500,
      bank_name: "GTBank",
      account_number: "012345678A", // letter
      account_name: "Zayd Tahir",
    };
    expect(withdrawalRequestSchema.safeParse(nonDigits).success).toBe(false);

    const tooLong = {
      amount_zed: 2500,
      bank_name: "GTBank",
      account_number: "01234567890", // 11 digits
      account_name: "Zayd Tahir",
    };
    expect(withdrawalRequestSchema.safeParse(tooLong).success).toBe(false);
  });

  it("rejects non-positive withdrawal amounts", () => {
    const zeroAmount = {
      amount_zed: 0,
      bank_name: "GTBank",
      account_number: "0123456789",
      account_name: "Zayd Tahir",
    };
    expect(withdrawalRequestSchema.safeParse(zeroAmount).success).toBe(false);

    const negativeAmount = {
      amount_zed: -100,
      bank_name: "GTBank",
      account_number: "0123456789",
      account_name: "Zayd Tahir",
    };
    expect(withdrawalRequestSchema.safeParse(negativeAmount).success).toBe(false);
  });

  it("validates admin settings updates and requires max >= min", () => {
    const valid = {
      token_price_ngn: 15.5,
      withdrawals_enabled: true,
      min_withdraw_zed: 1000,
      max_withdraw_zed: 50000,
      min_level: 2,
    };
    expect(adminSettingsSchema.safeParse(valid).success).toBe(true);

    const maxLessThanMin = {
      token_price_ngn: 15.5,
      withdrawals_enabled: true,
      min_withdraw_zed: 5000,
      max_withdraw_zed: 1000, // Invalid!
      min_level: 1,
    };
    expect(adminSettingsSchema.safeParse(maxLessThanMin).success).toBe(false);

    const negativePrice = {
      token_price_ngn: -1,
      withdrawals_enabled: true,
      min_withdraw_zed: 1000,
      max_withdraw_zed: 5000,
      min_level: 1,
    };
    expect(adminSettingsSchema.safeParse(negativePrice).success).toBe(false);
  });

  it("validates admin review decisions and enforces reject reason on rejection", () => {
    const approve = { decision: "approved" };
    expect(adminReviewSchema.safeParse(approve).success).toBe(true);

    const paid = { decision: "paid", note: "NIP transfer ref 1234" };
    expect(adminReviewSchema.safeParse(paid).success).toBe(true);

    const rejectWithoutReason = { decision: "rejected" };
    expect(adminReviewSchema.safeParse(rejectWithoutReason).success).toBe(false);

    const rejectWithReason = {
      decision: "rejected",
      reject_reason: "Account name mismatch with NIN registration",
    };
    expect(adminReviewSchema.safeParse(rejectWithReason).success).toBe(true);
  });
});

describe("Zed Withdrawals - Merge Function", () => {
  const sampleRows = [
    {
      id: "req-1",
      user_id: "user-alpha",
      amount_zed: 1000,
      price_ngn_snapshot: 15,
      amount_ngn: 15000,
      bank_name: "GTBank",
      account_number: "0123456789",
      account_name: "Alpha User",
      status: "pending",
      reject_reason: null,
      admin_note: null,
      created_at: "2026-10-18T10:00:00Z",
      reviewed_at: null,
      reviewed_by: null,
    },
    {
      id: "req-2",
      user_id: "user-missing",
      amount_zed: 2000,
      price_ngn_snapshot: 15,
      amount_ngn: 30000,
      bank_name: "Access Bank",
      account_number: "9876543210",
      account_name: "Deleted User",
      status: "pending",
      reject_reason: null,
      admin_note: null,
      created_at: "2026-10-18T11:00:00Z",
      reviewed_at: null,
      reviewed_by: null,
    },
  ];

  it("merges known user info when present in lookup map", () => {
    const usersMap = {
      "user-alpha": {
        id: "user-alpha",
        full_name: "Alpha Citizen",
        phone_number: "+2348012345678",
      },
    };

    const merged = mergeWithdrawalsWithUsers(sampleRows, usersMap);

    expect(merged).toHaveLength(2);
    expect(merged[0].user_name).toBe("Alpha Citizen");
    expect(merged[0].user_email).toBe("+2348012345678");
  });

  it("still lists rows when the matching user is missing or lookup failed", () => {
    const usersMap = {
      "user-alpha": {
        id: "user-alpha",
        full_name: "Alpha Citizen",
        phone_number: "+2348012345678",
      },
      // "user-missing" is deliberately absent
    };

    const merged = mergeWithdrawalsWithUsers(sampleRows, usersMap);

    expect(merged).toHaveLength(2);
    // Missing user row is still listed with fallback citizen label
    expect(merged[1].id).toBe("req-2");
    expect(merged[1].user_name).toBe("Unknown Citizen");
    expect(merged[1].user_email).toBe("");
    expect(merged[1].amount_zed).toBe(2000);
    expect(merged[1].status).toBe("pending");
  });

  it("preserves all rows even when user map is completely empty", () => {
    const merged = mergeWithdrawalsWithUsers(sampleRows, {});

    expect(merged).toHaveLength(2);
    expect(merged[0].id).toBe("req-1");
    expect(merged[0].user_name).toBe("Unknown Citizen");
    expect(merged[1].id).toBe("req-2");
    expect(merged[1].user_name).toBe("Unknown Citizen");
  });
});
