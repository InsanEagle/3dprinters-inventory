import "server-only";

const LOCAL_PLACEHOLDER = "change-me-before-production";

export function requireServerEnv(name: "AUTH_SECRET" | "PIN_HASH_SECRET") {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env and set ${name}.`
    );
  }

  if (process.env.NODE_ENV === "production" && value === LOCAL_PLACEHOLDER) {
    throw new Error(
      `Environment variable ${name} still uses the local placeholder value. Set a real secret before production start.`
    );
  }

  return value;
}
