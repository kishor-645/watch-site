/**
 * In-memory stand-in for `next/headers` so route handlers can run outside a Next request.
 * The jar behaves like a browser: cookies set by a response are sent with later requests.
 *
 * Usage (in a test file):
 *   vi.mock("next/headers", () => import("../helpers/next-headers").then((m) => m.nextHeadersModule));
 */

export interface SetCookieCall {
  name: string;
  value: string;
  options: Record<string, unknown> | undefined;
}

export const cookieJar = {
  values: new Map<string, string>(),
  sets: [] as SetCookieCall[],
  clear() {
    this.values.clear();
    this.sets.length = 0;
  },
  get(name: string): string | undefined {
    return this.values.get(name);
  },
  put(name: string, value: string) {
    this.values.set(name, value);
  },
};

function cookieStore() {
  return {
    get(name: string) {
      const value = cookieJar.values.get(name);
      return value === undefined ? undefined : { name, value };
    },
    getAll() {
      return [...cookieJar.values].map(([name, value]) => ({ name, value }));
    },
    has(name: string) {
      return cookieJar.values.has(name);
    },
    set(name: string, value: string, options?: Record<string, unknown>) {
      cookieJar.sets.push({ name, value, options });
      if (!value || options?.maxAge === 0) cookieJar.values.delete(name);
      else cookieJar.values.set(name, value);
    },
    delete(name: string) {
      cookieJar.values.delete(name);
    },
  };
}

export const nextHeadersModule = {
  cookies: async () => cookieStore(),
  headers: async () => new Headers(),
};
