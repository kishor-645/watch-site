/** Image upload rules shared by the admin UI (pre-checks) and the upload API (enforcement). */
export const UPLOAD_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const UPLOAD_PATH_PREFIXES = ["watches/", "site/"] as const;
