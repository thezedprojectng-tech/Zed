"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  usernameSchema,
  displayNameSchema,
  fullNameSchema,
} from "./validation";
import type {
  UpdateProfileParams,
  UpdateProfileResult,
} from "./types";

const MAX_AVATAR_SIZE_BYTES = 1048576; // 1 MB
const ALLOWED_AVATAR_MIMES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Update current user's profile via update_my_profile SECURITY DEFINER RPC.
 * Never allows client-side direct UPDATE on public.users.
 */
export async function updateMyProfile(
  params: UpdateProfileParams
): Promise<UpdateProfileResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Please sign in to update your profile." };
    }

    // Client-side / server action validation
    if (params.username !== undefined && params.username !== null) {
      const parsed = usernameSchema.safeParse(params.username);
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || "Invalid username" };
      }
    }

    if (params.display_name !== undefined && params.display_name !== null) {
      const parsed = displayNameSchema.safeParse(params.display_name);
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || "Invalid display name" };
      }
    }

    if (params.full_name !== undefined) {
      const parsed = fullNameSchema.safeParse(params.full_name);
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || "Invalid full name" };
      }
    }

    // Call update_my_profile RPC
    const { data, error } = await supabase.rpc("update_my_profile", {
      p_display_name: params.display_name ?? null,
      p_username: params.username ?? null,
      p_avatar_path: params.avatar_path ?? null,
      p_full_name: params.full_name ?? null,
      p_remove_avatar: params.remove_avatar ?? false,
    });

    if (error) {
      console.error("[profile] update_my_profile failed", {
        userId: user.id,
        params,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        },
      });

      if (error.code === "23505" || error.message?.includes("unique") || error.message?.includes("username")) {
        return { success: false, error: "That username is already taken. Please choose another." };
      }
      if (error.code === "P0003" || error.message?.includes("Rate limit")) {
        return { success: false, error: "Rate limit: you can save your profile at most 5 times per 24 hours." };
      }
      if (error.code === "P0004" || error.message?.includes("cooldown")) {
        return { success: false, error: error.message };
      }
      return { success: false, error: error.message || "Failed to update profile." };
    }

    revalidatePath("/profile");
    revalidatePath("/", "layout");

    const result = data as { ok?: boolean; message?: string; username_changed_at?: string };
    return {
      success: true,
      message: result?.message || "Profile updated successfully.",
      username_changed_at: result?.username_changed_at,
    };
  } catch (err: unknown) {
    const errorObj = err instanceof Error ? { message: err.message, stack: err.stack } : { err };
    console.error("[profile] updateMyProfile unexpected exception", errorObj);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred while updating profile.",
    };
  }
}

/**
 * Upload an avatar to the private 'avatars' bucket, update the profile,
 * and clean up the old avatar file from storage.
 */
export async function uploadAvatar(
  formData: FormData
): Promise<{ success: boolean; avatar_path?: string; error?: string }> {
  let file: File | null = null;
  let newStoragePath: string | null = null;

  try {
    file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No image file provided." };
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      return { success: false, error: "Image size exceeds the 1 MB limit." };
    }

    if (!ALLOWED_AVATAR_MIMES.includes(file.type)) {
      return { success: false, error: "Only JPEG, PNG, and WebP images are allowed." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[profile] uploadAvatar unauthorized", { userError });
      return { success: false, error: "Please sign in to upload an avatar." };
    }

    // Determine extension
    let ext = "jpg";
    if (file.type === "image/png" || file.name.toLowerCase().endsWith(".png")) {
      ext = "png";
    } else if (file.type === "image/webp" || file.name.toLowerCase().endsWith(".webp")) {
      ext = "webp";
    } else {
      ext = "jpg";
    }

    newStoragePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

    // Get current avatar_path so we can delete it after successful update
    const { data: currentProfile } = await supabase
      .from("users")
      .select("avatar_path")
      .eq("id", user.id)
      .maybeSingle();

    const oldAvatarPath = currentProfile?.avatar_path;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(newStoragePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[profile] uploadAvatar storage upload failed", {
        path: newStoragePath,
        bucket: "avatars",
        type: file.type,
        size: file.size,
        error: {
          message: uploadError.message,
          name: uploadError.name,
        },
      });
      return { success: false, error: `Avatar upload failed: ${uploadError.message}` };
    }

    // Update profile via RPC
    const { error: rpcError } = await supabase.rpc("update_my_profile", {
      p_avatar_path: newStoragePath,
      p_remove_avatar: false,
    });

    if (rpcError) {
      console.error("[profile] uploadAvatar RPC update failed", {
        path: newStoragePath,
        error: rpcError,
      });
      // Cleanup the uploaded file to avoid orphaned storage objects
      await supabase.storage.from("avatars").remove([newStoragePath]);
      return { success: false, error: rpcError.message || "Failed to update profile with avatar." };
    }

    // Delete old avatar from storage if one existed and belongs to this user
    if (oldAvatarPath && oldAvatarPath !== newStoragePath && oldAvatarPath.startsWith(`${user.id}/`)) {
      const { error: deleteOldError } = await supabase.storage
        .from("avatars")
        .remove([oldAvatarPath]);

      if (deleteOldError) {
        console.warn("[profile] Could not delete old avatar:", oldAvatarPath, deleteOldError.message);
      } else {
        console.log("[profile] Successfully deleted old avatar:", oldAvatarPath);
      }
    }

    revalidatePath("/profile");
    revalidatePath("/", "layout");

    return { success: true, avatar_path: newStoragePath };
  } catch (err: unknown) {
    console.error("[profile] uploadAvatar unexpected error", err);
    // Cleanup if partially uploaded
    if (newStoragePath) {
      try {
        const supabase = await createClient();
        await supabase.storage.from("avatars").remove([newStoragePath]);
      } catch {
        // ignore cleanup error
      }
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred while uploading avatar.",
    };
  }
}

/**
 * Remove avatar via update_my_profile (p_remove_avatar = true)
 * and delete the file from storage.
 */
export async function removeAvatar(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Please sign in." };
    }

    // Get current avatar_path before clearing
    const { data: currentProfile } = await supabase
      .from("users")
      .select("avatar_path")
      .eq("id", user.id)
      .maybeSingle();

    const oldAvatarPath = currentProfile?.avatar_path;

    const { error: rpcError } = await supabase.rpc("update_my_profile", {
      p_remove_avatar: true,
    });

    if (rpcError) {
      console.error("[profile] removeAvatar RPC failed", { error: rpcError });
      return { success: false, error: rpcError.message || "Failed to remove avatar." };
    }

    // Delete from storage
    if (oldAvatarPath && oldAvatarPath.startsWith(`${user.id}/`)) {
      const { error: removeError } = await supabase.storage
        .from("avatars")
        .remove([oldAvatarPath]);

      if (removeError) {
        console.warn("[profile] Could not delete avatar file from storage:", oldAvatarPath, removeError.message);
      }
    }

    revalidatePath("/profile");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (err: unknown) {
    console.error("[profile] removeAvatar unexpected error", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred while removing avatar.",
    };
  }
}
