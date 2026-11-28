"use client";

import { useCallback, type RefObject } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { AlertTriangle, RefreshCw } from "lucide-react";

const TURNSTILE_SITEKEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
  process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ??
  null;

const DEV_TEST_KEY = "1x00000000000000000000AA";
const IS_PROD = process.env.NODE_ENV === "production";

export const resolvedTurnstileSitekey =
  TURNSTILE_SITEKEY ?? (IS_PROD ? null : DEV_TEST_KEY);

interface AuthTurnstileProps {
  turnstileRef: RefObject<TurnstileInstance | null>;
  error: string | null;
  onTokenChange: (token: string | null) => void;
  onErrorChange: (error: string | null) => void;
}

export function AuthTurnstile({
  turnstileRef,
  error,
  onTokenChange,
  onErrorChange,
}: AuthTurnstileProps) {
  const handleRetry = useCallback(() => {
    try {
      turnstileRef.current?.reset();
    } catch {
      /* ignore */
    }
    onTokenChange(null);
    onErrorChange(null);
  }, [turnstileRef, onTokenChange, onErrorChange]);

  if (IS_PROD && !resolvedTurnstileSitekey) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        <span>Human verification is unavailable. Please try again later.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {resolvedTurnstileSitekey && (
        <div
          className="w-full min-h-[65px] flex items-center justify-center overflow-hidden rounded-xl border border-hairline bg-secondary/20 p-1"
          aria-label="Human verification widget"
        >
          <Turnstile
            ref={turnstileRef}
            siteKey={resolvedTurnstileSitekey}
            options={{
              theme: "auto",
              size: "normal",
            }}
            onSuccess={(token) => {
              onTokenChange(token);
              onErrorChange(null);
            }}
            onExpire={() => {
              onTokenChange(null);
              onErrorChange("Please confirm you are human and try again.");
            }}
            onError={() => {
              onTokenChange(null);
              onErrorChange("Please confirm you are human and try again.");
            }}
            className="w-full"
          />
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="shrink-0 p-1 hover:bg-destructive/20 rounded cursor-pointer"
            aria-label="Retry verification"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
