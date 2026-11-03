import { z } from "zod";

/** bcrypt only uses the first 72 bytes of a password, so longer inputs are rejected. */
const BCRYPT_MAX_BYTES = 72;
export const MIN_PASSWORD_LENGTH = 12;

const byteLength = (s: string) => new TextEncoder().encode(s).length;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9._-]+$/, "Use letters, numbers, dots, hyphens or underscores");

export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Enter your username").max(64),
  password: z.string().min(1, "Enter your password").max(200),
});

export const newPasswordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters`)
  .refine((p) => byteLength(p) <= BCRYPT_MAX_BYTES, "Password is too long (max 72 bytes)")
  .refine((p) => /[a-zA-Z]/.test(p) && /[0-9]/.test(p), "Include at least one letter and one number");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(200),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((d, ctx) => {
    if (d.newPassword !== d.confirmPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match" });
    }
    if (d.newPassword === d.currentPassword) {
      ctx.addIssue({ code: "custom", path: ["newPassword"], message: "Choose a password you have not used here" });
    }
  });

export type LoginInput = z.input<typeof loginSchema>;
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
