import { describe, expect, it } from "vitest";
import {
  formatLeaderboardLevel,
  formatLeaderboardValue,
  getAvatarInitials,
  getBoardValueLabel,
  getLeaderboardAvatarSrc,
  normalizeLeaderboardResponse,
  resolveTiedRanks,
} from "./format";

describe("leaderboard formatting helpers", () => {
  it("resolves avatar src preferring avatar_path over avatar_url", () => {
    expect(getLeaderboardAvatarSrc("users/abc.webp", "https://example.com/a.jpg")).toBe(
      "/api/avatar/users/abc.webp"
    );
    expect(getLeaderboardAvatarSrc("/users/abc.webp", null)).toBe(
      "/api/avatar/users/abc.webp"
    );
    expect(getLeaderboardAvatarSrc(null, "https://example.com/a.jpg")).toBe(
      "https://example.com/a.jpg"
    );
    expect(getLeaderboardAvatarSrc(null, null)).toBeUndefined();
  });

  it("derives initials safely", () => {
    expect(getAvatarInitials("Ade O.")).toBe("AO");
    expect(getAvatarInitials("Zayd")).toBe("ZA");
    expect(getAvatarInitials("")).toBe("ZE");
    expect(getAvatarInitials(null)).toBe("ZE");
  });

  it("formats board value labels and numbers", () => {
    expect(getBoardValueLabel("learners")).toBe("points");
    expect(getBoardValueLabel("consistency")).toBe("days mined");
    expect(formatLeaderboardValue(1250)).toBe("1,250");
    expect(formatLeaderboardValue(-5)).toBe("0");
  });

  it("formats level badge and title", () => {
    const info = formatLeaderboardLevel(2);
    expect(info.badge).toBe("Level 2");
    expect(info.title.length).toBeGreaterThan(0);
    expect(formatLeaderboardLevel(null).badge).toBe("Level 1");
  });

  it("keeps tied rank values at the same rank", () => {
    const ranked = resolveTiedRanks([
      { rank: 1, name: "Ade O.", avatar_path: null, avatar_url: null, level: 3, value: 120, is_me: false },
      { rank: 2, name: "Bola K.", avatar_path: null, avatar_url: null, level: 2, value: 120, is_me: true },
      { rank: 3, name: "Chidi N.", avatar_path: null, avatar_url: null, level: 2, value: 90, is_me: false },
    ]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 1, 3]);
  });

  it("normalizes RPC payloads safely", () => {
    const normalized = normalizeLeaderboardResponse(
      {
        board: "consistency",
        period: "all",
        entries: [
          {
            rank: 1,
            name: "Ade O.",
            avatar_path: "u/1.png",
            avatar_url: null,
            level: 4,
            value: 30,
            is_me: true,
          },
        ],
        me: { rank: 1, value: 30, hidden: false },
      },
      "learners",
      "week"
    );

    expect(normalized.board).toBe("consistency");
    expect(normalized.period).toBe("all");
    expect(normalized.entries).toHaveLength(1);
    expect(normalized.me).toEqual({ rank: 1, value: 30, hidden: false });
  });
});
