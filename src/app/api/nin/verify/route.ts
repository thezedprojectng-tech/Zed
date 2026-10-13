import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ninSchema } from "@/lib/nin/validate";
import { hashNin } from "@/lib/nin/hash";

const verifyPayloadSchema = z.object({
  nin: ninSchema,
});

// ─────────────────────────────────────────────────────────────────────────────
// MOCK provider integration – replace with Dojah / Prembly / Smile ID in Phase 2
// ─────────────────────────────────────────────────────────────────────────────
async function verifyNinWithProvider(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _nin: string
): Promise<{ verified: boolean; message: string }> {
  // ⚠️ MOCK: Always returns verified = true.
  // TODO (Phase 2): Integrate real NIN verification provider here.
  // Options: Dojah (https://dojah.io), Prembly (https://prembly.com), Smile Identity.
  // The real NIN must be passed securely via HTTPS – never logged.
  return { verified: true, message: "MOCK: NIN accepted (placeholder)" };
}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/nin/verify
 * 1. Validates the 11-digit NIN format.
 * 2. Calls verifyNinWithProvider() (currently a MOCK).
 * 3. Stores only the salted hash – never the raw NIN.
 * 4. Sets is_verified = true on the user record.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nin } = verifyPayloadSchema.parse(body);

    // 1. Call the provider (MOCK in Phase 1)
    const result = await verifyNinWithProvider(nin);
    if (!result.verified) {
      return NextResponse.json(
        { success: false, message: "NIN could not be verified." },
        { status: 400 }
      );
    }

    // 2. Hash the NIN – raw NIN is discarded after this point
    const ninHash = hashNin(nin);

    // 3. Persist hash and mark user verified
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("users")
      .update({ nin_hash: ninHash, is_verified: true })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      is_verified: true,
      message: "NIN verified successfully.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 422 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
