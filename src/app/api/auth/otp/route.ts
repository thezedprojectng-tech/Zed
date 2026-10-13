import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const otpRequestSchema = z.object({
  phone_number: z
    .string()
    .trim()
    .regex(
      /^\+?[1-9]\d{7,14}$/,
      "Phone number must be in E.164 format (e.g. +2348012345678)"
    ),
});

/**
 * POST /api/auth/otp
 * Sends an SMS OTP via Supabase Phone Auth.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone_number } = otpRequestSchema.parse(body);

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithOtp({
      phone: phone_number,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 422 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
