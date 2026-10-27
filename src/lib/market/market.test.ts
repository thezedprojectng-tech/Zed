import { describe, it, expect } from "vitest";
import {
  createListingSchema,
  reportListingSchema,
  adminRemoveListingSchema,
  escapeSearchQuery,
  isValidImagePath,
} from "./validation";
import {
  formatNgnPrice,
  buildWhatsAppLink,
  mapMarketError,
  CATEGORY_DEFINITIONS,
  PROHIBITED_ITEMS,
} from "./helpers";

describe("Zed Market - Search Query Escaping", () => {
  it("escapes SQL % and _ wildcards in search query", () => {
    expect(escapeSearchQuery("iPhone 100%")).toBe("iPhone 100\\%");
    expect(escapeSearchQuery("item_name")).toBe("item\\_name");
    expect(escapeSearchQuery("100%_guaranteed")).toBe("100\\%\\_guaranteed");
  });

  it("leaves standard alphanumeric text unaffected", () => {
    expect(escapeSearchQuery("MacBook Pro M2")).toBe("MacBook Pro M2");
    expect(escapeSearchQuery("Lagos Island")).toBe("Lagos Island");
  });

  it("trims whitespace", () => {
    expect(escapeSearchQuery("  electronics  ")).toBe("electronics");
  });
});

describe("Zed Market - Image Path Regex Validation", () => {
  const userId = "550e8400-e29b-41d4-a716-446655440000";

  it("accepts valid image paths adhering to ^<userId>/[A-Za-z0-9_.-]{1,100}$", () => {
    expect(isValidImagePath(`${userId}/photo-1.jpg`, userId)).toBe(true);
    expect(isValidImagePath(`${userId}/IMG_2026.PNG`, userId)).toBe(true);
    expect(isValidImagePath(`${userId}/item.webp`, userId)).toBe(true);
    expect(isValidImagePath(`${userId}/a-b_c.123.jpg`, userId)).toBe(true);
  });

  it("rejects paths with a different user ID", () => {
    const otherId = "11111111-2222-3333-4444-555555555555";
    expect(isValidImagePath(`${otherId}/photo.jpg`, userId)).toBe(false);
  });

  it("rejects directory traversal and malicious characters", () => {
    expect(isValidImagePath(`${userId}/../secret.jpg`, userId)).toBe(false);
    expect(isValidImagePath(`${userId}/sub/folder/pic.jpg`, userId)).toBe(false);
    expect(isValidImagePath(`${userId}/photo;drop.jpg`, userId)).toBe(false);
    expect(isValidImagePath("", userId)).toBe(false);
  });
});

describe("Zed Market - Create Listing Validation Schema", () => {
  const validBase = {
    title: "Professional Logo Design",
    description: "I will design a modern logo for your brand with unlimited revisions included in the price.",
    category: "design-and-creative",
    price_ngn: 25000,
    condition: "na",
    location: "Lagos, Yaba",
    image_paths: ["550e8400-e29b-41d4-a716-446655440000/portfolio.jpg"],
    contact_whatsapp: "+2348012345678",
    confirm_allowed: true,
  };

  it("validates valid listing input", () => {
    const res = createListingSchema.safeParse(validBase);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.price_ngn).toBe(25000);
      expect(res.data.title).toBe("Professional Logo Design");
    }
  });

  it("accepts null or empty price as contact for price", () => {
    const resNull = createListingSchema.safeParse({ ...validBase, price_ngn: null });
    expect(resNull.success).toBe(true);
    if (resNull.success) {
      expect(resNull.data.price_ngn).toBeNull();
    }

    const resEmpty = createListingSchema.safeParse({ ...validBase, price_ngn: "" });
    expect(resEmpty.success).toBe(true);
    if (resEmpty.success) {
      expect(resEmpty.data.price_ngn).toBeNull();
    }
  });

  it("rejects negative price", () => {
    const res = createListingSchema.safeParse({ ...validBase, price_ngn: -500 });
    expect(res.success).toBe(false);
  });

  it("rejects title shorter than 3 characters or longer than 120", () => {
    const shortRes = createListingSchema.safeParse({ ...validBase, title: "ab" });
    expect(shortRes.success).toBe(false);

    const longRes = createListingSchema.safeParse({ ...validBase, title: "x".repeat(121) });
    expect(longRes.success).toBe(false);
  });

  it("rejects description shorter than 20 characters", () => {
    const shortDesc = createListingSchema.safeParse({ ...validBase, description: "Too short" });
    expect(shortDesc.success).toBe(false);
  });

  it("rejects invalid categories", () => {
    const badCategory = createListingSchema.safeParse({ ...validBase, category: "crypto-trading" });
    expect(badCategory.success).toBe(false);
  });

  it("rejects more than 4 images", () => {
    const tooManyImages = createListingSchema.safeParse({
      ...validBase,
      image_paths: ["img1", "img2", "img3", "img4", "img5"],
    });
    expect(tooManyImages.success).toBe(false);
  });

  it("requires confirm_allowed to be true", () => {
    const unconfirmed = createListingSchema.safeParse({ ...validBase, confirm_allowed: false });
    expect(unconfirmed.success).toBe(false);
  });

  it("accepts valid WhatsApp phone numbers and rejects invalid formats", () => {
    expect(createListingSchema.safeParse({ ...validBase, contact_whatsapp: "+234 802 345 6789" }).success).toBe(true);
    expect(createListingSchema.safeParse({ ...validBase, contact_whatsapp: "08012345678" }).success).toBe(true);
    expect(createListingSchema.safeParse({ ...validBase, contact_whatsapp: "123" }).success).toBe(false); // too short
    expect(createListingSchema.safeParse({ ...validBase, contact_whatsapp: "invalid-phone!" }).success).toBe(false);
  });
});

describe("Zed Market - Report Listing Schema", () => {
  it("accepts valid report reasons", () => {
    const valid = {
      listing_id: "550e8400-e29b-41d4-a716-446655440000",
      reason: "scam",
      note: "Seller requested advance payment before meeting.",
    };
    expect(reportListingSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid reasons", () => {
    const invalid = {
      listing_id: "550e8400-e29b-41d4-a716-446655440000",
      reason: "dislike_color",
    };
    expect(reportListingSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects notes longer than 300 characters", () => {
    const longNote = {
      listing_id: "550e8400-e29b-41d4-a716-446655440000",
      reason: "other",
      note: "a".repeat(301),
    };
    expect(reportListingSchema.safeParse(longNote).success).toBe(false);
  });
});

describe("Zed Market - Admin Remove Listing Schema", () => {
  it("requires reason of at least 3 characters", () => {
    expect(
      adminRemoveListingSchema.safeParse({
        listing_id: "550e8400-e29b-41d4-a716-446655440000",
        reason: "Prohibited weapon listed",
      }).success
    ).toBe(true);

    expect(
      adminRemoveListingSchema.safeParse({
        listing_id: "550e8400-e29b-41d4-a716-446655440000",
        reason: "no",
      }).success
    ).toBe(false);
  });
});

describe("Zed Market - Formatters and Helpers", () => {
  it("formats NGN prices correctly", () => {
    expect(formatNgnPrice(null)).toBe("Contact for price");
    expect(formatNgnPrice(undefined)).toBe("Contact for price");
    expect(formatNgnPrice(0)).toBe("Free");
    expect(formatNgnPrice(25000)).toBe("₦25,000");
    expect(formatNgnPrice(1250000)).toBe("₦1,250,000");
  });

  it("builds WhatsApp chat links with encoded titles", () => {
    const link = buildWhatsAppLink("08012345678", "Chemistry Textbook");
    expect(link).toContain("https://wa.me/2348012345678");
    expect(link).toContain("Chemistry%20Textbook");
  });

  it("maps known database errors to friendly user messages", () => {
    expect(mapMarketError("Only verified users can create marketplace listings.")).toContain("Only verified users");
    expect(mapMarketError("You have reached the limit of 10 active listings.")).toContain("maximum limit of 10 active listings");
    expect(mapMarketError("Daily limit reached: You can create at most 5 listings")).toContain("up to 5 listings every 24 hours");
    expect(mapMarketError("Daily contact limit reached")).toContain("at most 30 seller contacts");
    expect(mapMarketError("You have already reported this listing.")).toContain("already reported");
  });

  it("contains all 11 service categories with labels and descriptions", () => {
    const categories = Object.keys(CATEGORY_DEFINITIONS);
    expect(categories).toHaveLength(11);
    expect(categories).toContain("design-and-creative");
    expect(categories).toContain("tech-and-development");
    expect(categories).toContain("tutoring-and-lessons");
    expect(categories).toContain("writing-and-translation");
    expect(categories).toContain("photography-and-video");
    expect(categories).toContain("fashion-and-beauty-services");
    expect(categories).toContain("repairs-and-maintenance");
    expect(categories).toContain("errands-and-delivery");
    expect(categories).toContain("events-and-entertainment");
    expect(categories).toContain("business-and-admin");
    expect(categories).toContain("other-services");
    // Legacy goods categories must NOT be present in new service-only market
    expect(categories).not.toContain("electronics");
    expect(categories).not.toContain("fashion");
    expect(categories).not.toContain("food");
    expect(categories).not.toContain("books-and-notes");
  });

  it("includes prohibited items list conforming to safety rules", () => {
    expect(PROHIBITED_ITEMS.length).toBeGreaterThanOrEqual(6);
  });
});
