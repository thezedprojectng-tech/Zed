export interface ProfileData {
  id: string;
  phone_number: string;
  full_name: string;
  display_name: string | null;
  username: string | null;
  avatar_path: string | null;
  avatar_url?: string | null;
  level_id: number;
  is_verified: boolean;
  role: "user" | "admin";
  username_changed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileParams {
  display_name?: string | null;
  username?: string | null;
  full_name?: string;
  avatar_path?: string | null;
  remove_avatar?: boolean;
}

export interface UpdateProfileResult {
  success: boolean;
  message?: string;
  error?: string;
  username_changed_at?: string;
}

export interface AdminClearProfileParams {
  userId: string;
  clearUsername: boolean;
  clearDisplayName: boolean;
  clearAvatar: boolean;
  reason: string;
}

export interface AdminClearProfileResult {
  success: boolean;
  message?: string;
  error?: string;
  cleared?: string[];
}
