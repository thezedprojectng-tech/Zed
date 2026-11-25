/**
 * Pure helper utilities for the learner-side timed, quizzed courses.
 */

export function formatCountdownMmSs(seconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function buildQuizAnswersPayload(
  questions: Array<{ id: string }>,
  selected: Record<string, number | undefined>
): Record<string, number> {
  const payload: Record<string, number> = {};
  for (const q of questions) {
    const choice = selected[q.id];
    if (typeof choice === "number" && Number.isInteger(choice) && choice >= 0) {
      payload[q.id] = choice;
    }
  }
  return payload;
}

export function areAllQuestionsAnswered(
  questions: Array<{ id: string }>,
  selected: Record<string, number | undefined>
): boolean {
  if (questions.length === 0) return false;
  return questions.every((q) => {
    const choice = selected[q.id];
    return typeof choice === "number" && Number.isInteger(choice) && choice >= 0;
  });
}

export type VideoEmbedInfo =
  | { kind: "youtube"; embedUrl: string }
  | { kind: "vimeo"; embedUrl: string }
  | { kind: "link"; href: string }
  | { kind: "none" };

export function parseVideoEmbed(url: string | null | undefined): VideoEmbedInfo {
  if (!url || !url.trim()) return { kind: "none" };
  const raw = url.trim();

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { kind: "none" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { kind: "none" };
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

  // YouTube
  if (host === "youtube.com" || host === "m.youtube.com") {
    let videoId: string | null = null;
    if (parsed.pathname === "/watch") {
      videoId = parsed.searchParams.get("v");
    } else if (parsed.pathname.startsWith("/embed/")) {
      videoId = parsed.pathname.split("/embed/")[1]?.split("/")[0] ?? null;
    } else if (parsed.pathname.startsWith("/shorts/")) {
      videoId = parsed.pathname.split("/shorts/")[1]?.split("/")[0] ?? null;
    }
    if (videoId && /^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
      return {
        kind: "youtube",
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=0`,
      };
    }
  }

  if (host === "youtu.be") {
    const videoId = parsed.pathname.replace(/^\//, "").split("/")[0];
    if (videoId && /^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
      return {
        kind: "youtube",
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=0`,
      };
    }
  }

  // Vimeo
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const parts = parsed.pathname.split("/").filter(Boolean);
    const maybeId =
      host === "player.vimeo.com" && parts[0] === "video"
        ? parts[1]
        : parts[parts.length - 1];
    if (maybeId && /^[0-9]{5,15}$/.test(maybeId)) {
      return {
        kind: "vimeo",
        embedUrl: `https://player.vimeo.com/video/${maybeId}?dnt=1&autoplay=0`,
      };
    }
  }

  return { kind: "link", href: raw };
}
