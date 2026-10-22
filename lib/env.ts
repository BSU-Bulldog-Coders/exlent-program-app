import "server-only";

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

/**
 * Public base URL used for auth callbacks and email links. An explicit
 * NEXT_PUBLIC_APP_URL / BETTER_AUTH_URL wins; on Vercel it falls back to the
 * deployment's own domain so previews and first deploys work without extra setup.
 */
export function appUrl(): string {
  const vercelHost =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.VERCEL_URL;
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    (vercelHost ? `https://${vercelHost}` : "http://localhost:3000")
  ).replace(/\/$/, "");
}
