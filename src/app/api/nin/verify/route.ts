import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ninSchema } from "@/lib/nin/validate";
import { hashNin } from "@/lib/nin/hash";

const verifyPayloadSchema = z.object({
  nin: ninSchema,
});

// ─────────────────────────────────────────────────────────────────────────────
// MOCK provider integration – simulated NIMC sandbox for demo purposes
// ─────────────────────────────────────────────────────────────────────────────
async function verifyNinWithProvider(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _nin: string
): Promise<{ verified: boolean; message: string }> {
  // ⚠️ DEMO MOCK: Simulates verification check with NIMC records.
  // TODO (Production): Integrate official NIMC verified partner (e.g. Dojah, Prembly, Smile ID).
  // The raw NIN must never be logged or stored.
  return { verified: true, message: "DEMO MOCK: NIN verified against simulated NIMC registry." };
}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/nin/verify
 * 1. Requires an authenticated session.
 * 2. Validates 11 digits using zod.
 * 3. Hashes with salted SHA-256 (NIN_HASH_SALT, server-only; raw NIN is never stored/logged).
 * 4. Calls verifyNinWithProvider() (clearly marked MOCK).
 * 5. Updates nin_hash and is_verified via the SERVICE ROLE client (bypass RLS restriction).
 * 6. Handles duplicate nin_hash unique constraint gracefully (409 Conflict).
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate user from session cookies
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to verify NIN." },
        { status: 401 }
      );
    }

    // 2. Validate payload
    const body = await request.json();
    const { nin } = verifyPayloadSchema.parse(body);

    // 3. Call provider mock
    const providerResult = await verifyNinWithProvider(nin);
    if (!providerResult.verified) {
      return NextResponse.json(
        { success: false, error: providerResult.message || "NIN verification failed with provider." },
        { status: 400 }
      );
    }

    // 4. Compute salted SHA-256 hash (raw NIN is discarded after this line)
    const ninHash = hashNin(nin);

    // 5. Update user profile using SERVICE ROLE client
    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient
      .from("users")
      .update({
        nin_hash: ninHash,
        is_verified: true,
      })
      .eq("id", user.id);

    if (updateError) {
      // Check for unique constraint violation on nin_hash
      if (
        updateError.code === "23505" ||
        updateError.message.includes("unique") ||
        updateError.message.includes("nin_hash")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "This National Identity Number is already registered to another account.",
          },
          { status: 409 }
        );
      }

      console.error("Failed to update user verification:", updateError.message);
      return NextResponse.json(
        { success: false, error: "Database error updating verification status." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      is_verified: true,
      message: "National Identity verified successfully! Rookie (Level 1) unlocked.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: err.issues[0]?.message || "Invalid NIN format (must be exactly 11 digits)." },
        { status: 422 }
      );
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
