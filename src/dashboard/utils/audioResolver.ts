interface CachedAudioEntry {
  url: string;
  expiresAt: number;
  key: string;
}

const CACHE_STORAGE_KEY = 'unblock_studio_s3_audio_cache';
const DETAILS_STORAGE_KEY = 'unblock_studio_audio_details';
const CACHE_TTL_MS = 50 * 60 * 1000; // 50 minutes cache (presigned URLs expire in 60m)

/**
 * Extract S3 object key from an S3 bucket URL or s3:// URI.
 * Examples:
 *   https://bucket.s3.us-east-1.amazonaws.com/jobs/123/meditation.mp3 -> jobs/123/meditation.mp3
 *   https://s3.amazonaws.com/bucket/jobs/123/meditation.mp3 -> jobs/123/meditation.mp3
 *   s3://bucket/jobs/123/meditation.mp3 -> jobs/123/meditation.mp3
 */
export function extractS3Key(url: string): string | null {
  if (!url) return null;

  if (url.startsWith('s3://')) {
    const parts = url.slice(5).split('/');
    parts.shift(); // remove bucket
    return parts.join('/');
  }

  if (url.includes('s3.amazonaws.com') || url.includes('.s3.')) {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname.startsWith('/') ? parsed.pathname.slice(1) : parsed.pathname;
      return pathname;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Check localStorage for valid cached presigned URL for an S3 key
 */
function getCachedPresignedUrl(key: string): string | null {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return null;
    const cache: Record<string, CachedAudioEntry> = JSON.parse(raw);
    const entry = cache[key];
    if (entry && entry.expiresAt > Date.now()) {
      return entry.url;
    }
  } catch (err) {
    console.warn('[AudioResolver] Error reading cache from localStorage:', err);
  }
  return null;
}

/**
 * Cache presigned URL in localStorage
 */
function setCachedPresignedUrl(key: string, url: string): void {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    const cache: Record<string, CachedAudioEntry> = raw ? JSON.parse(raw) : {};
    cache[key] = {
      key,
      url,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn('[AudioResolver] Error writing cache to localStorage:', err);
  }
}

/**
 * Save additional audio metadata details to localStorage
 */
export function saveAudioDetails(key: string, details: Record<string, any>): void {
  try {
    const raw = localStorage.getItem(DETAILS_STORAGE_KEY);
    const store: Record<string, any> = raw ? JSON.parse(raw) : {};
    store[key] = {
      ...store[key],
      ...details,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(DETAILS_STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('[AudioResolver] Error saving audio details to localStorage:', err);
  }
}

/**
 * Retrieve saved audio metadata details from localStorage
 */
export function getSavedAudioDetails(key: string): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(DETAILS_STORAGE_KEY);
    if (!raw) return null;
    const store: Record<string, any> = JSON.parse(raw);
    return store[key] || null;
  } catch {
    return null;
  }
}

/**
 * Resolves an audio URL to a playable URL.
 * If rawUrl is an S3 URL/key:
 *  1. Checks localStorage for a valid presigned URL.
 *  2. If missing/expired, fetches a fresh presigned URL from GET /api/audio-url?key=...
 *  3. Caches and returns the URL.
 * If rawUrl is local/relative or regular HTTP, returns it directly.
 */
export async function getPlayableAudioUrl(
  rawUrl: string,
  customBackendUrl?: string,
  customApiKey?: string
): Promise<string> {
  if (!rawUrl) return '';

  const backendUrl = customBackendUrl || (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
  const apiKey = customApiKey || (import.meta as any).env?.VITE_API_KEY || 'test-key';

  const s3Key = extractS3Key(rawUrl);

  // If it's not an S3 URL, format relative URLs if needed and return
  if (!s3Key) {
    if (rawUrl.startsWith('/')) {
      return `${backendUrl}${rawUrl}`;
    }
    return rawUrl;
  }

  // 1. Check local storage cache
  const cachedUrl = getCachedPresignedUrl(s3Key);
  if (cachedUrl) {
    return cachedUrl;
  }

  // 2. Fetch fresh presigned URL from backend
  try {
    const res = await fetch(`${backendUrl}/api/audio-url?key=${encodeURIComponent(s3Key)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        setCachedPresignedUrl(s3Key, data.url);
        saveAudioDetails(s3Key, { rawUrl, resolvedAt: new Date().toISOString() });
        return data.url;
      }
    }
  } catch (err) {
    console.warn(`[AudioResolver] Failed to fetch presigned URL for ${s3Key}:`, err);
  }

  // Fallback to rawUrl if request fails
  return rawUrl.startsWith('/') ? `${backendUrl}${rawUrl}` : rawUrl;
}
