// S3: Rate limiting for file upload endpoints.
// Prevents abuse of OCR and image analysis endpoints.

const uploadCounts = new Map<string, { count: number; resetAt: number }>();

const UPLOAD_LIMITS = {
  ocr: { windowMs: 60_000, maxRequests: 10 },
  image_analysis: { windowMs: 60_000, maxRequests: 8 },
} as const;

export type UploadEndpoint = keyof typeof UPLOAD_LIMITS;

/**
 * Check if an upload request is allowed.
 * Uses per-user in-memory tracking.
 */
export function checkUploadRateLimit(
  userId: string,
  endpoint: UploadEndpoint
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const config = UPLOAD_LIMITS[endpoint];
  const key = `${endpoint}:${userId}`;
  const now = Date.now();

  const entry = uploadCounts.get(key);

  if (!entry || now > entry.resetAt) {
    uploadCounts.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, retryAfterMs: 0 };
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    retryAfterMs: 0,
  };
}
