/**
 * Gemini API 共通ユーティリティ
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('[gemini] GEMINI_API_KEY is not set. Gemini features will fail.');
}

export const GEMINI_URL = (model = 'gemini-2.0-flash') =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

export function requireGeminiKey(): void {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_BASE64_LENGTH = 7_000_000; // ~5MB image
export const MAX_NAME_LENGTH = 100;
