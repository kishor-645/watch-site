import { vi } from "vitest";

// Outside a Next.js server there is no incremental cache — run cached functions directly.
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));
