/**
 * Video Embedding and ID extraction utilities
 * Supports YouTube (all variants: watch, shorts, live, embed, youtu.be, nocookie),
 * Vimeo, Dailymotion, and direct video files.
 */

export interface VideoEmbedInfo {
  type: "youtube" | "vimeo" | "dailymotion" | "direct";
  id: string | null;
  embedUrl: string;
  originalUrl: string;
}

/**
 * Extracts a clean 11-character YouTube video ID from any valid YouTube URL or embed string.
 */
export function extractYouTubeId(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // If already a clean 11-character ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // If full <iframe> tag was pasted
  const iframeSrcMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  const targetUrl = iframeSrcMatch ? iframeSrcMatch[1].trim() : trimmed;

  // Comprehensive Regex covering all YouTube domains and paths
  const ytRegex = /(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)|youtube-nocookie\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = targetUrl.match(ytRegex);
  return match ? match[1] : null;
}

/**
 * Extracts Vimeo video ID from a URL or embed string.
 */
export function extractVimeoId(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const iframeSrcMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  const targetUrl = iframeSrcMatch ? iframeSrcMatch[1].trim() : trimmed;

  const match = targetUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)|player\.vimeo\.com\/video\/(\d+))/i);
  return match ? (match[1] || match[2]) : null;
}

/**
 * Extracts Dailymotion video ID from a URL or embed string.
 */
export function extractDailymotionId(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const iframeSrcMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  const targetUrl = iframeSrcMatch ? iframeSrcMatch[1].trim() : trimmed;

  const match = targetUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:dailymotion\.com\/(?:video|embed\/video)\/|dai\.ly\/)([a-zA-Z0-9]+)/i);
  return match ? match[1] : null;
}

/**
 * Parses any video URL and returns structured embed metadata.
 */
export function getVideoEmbedInfo(url: string | null | undefined): VideoEmbedInfo | null {
  if (!url || typeof url !== "string") return null;
  const cleanUrl = url.trim();
  if (!cleanUrl) return null;

  // 1. YouTube
  const ytId = extractYouTubeId(cleanUrl);
  if (ytId) {
    return {
      type: "youtube",
      id: ytId,
      embedUrl: `https://www.youtube.com/embed/${ytId}`,
      originalUrl: cleanUrl,
    };
  }

  // 2. Vimeo
  const vimeoId = extractVimeoId(cleanUrl);
  if (vimeoId) {
    return {
      type: "vimeo",
      id: vimeoId,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      originalUrl: cleanUrl,
    };
  }

  // 3. Dailymotion
  const dmId = extractDailymotionId(cleanUrl);
  if (dmId) {
    return {
      type: "dailymotion",
      id: dmId,
      embedUrl: `https://www.dailymotion.com/embed/video/${dmId}`,
      originalUrl: cleanUrl,
    };
  }

  // 4. Direct video URL fallback
  return {
    type: "direct",
    id: null,
    embedUrl: cleanUrl,
    originalUrl: cleanUrl,
  };
}

/**
 * Returns the highest resolution video thumbnail available for a video.
 */
export function getVideoThumbnail(url: string | null | undefined, fallback = "/images/courses/web3.png"): string {
  if (!url || typeof url !== "string") return fallback;
  const cleanUrl = url.trim();

  const ytId = extractYouTubeId(cleanUrl);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }

  const dmId = extractDailymotionId(cleanUrl);
  if (dmId) {
    return `https://www.dailymotion.com/thumbnail/video/${dmId}`;
  }

  return fallback;
}
