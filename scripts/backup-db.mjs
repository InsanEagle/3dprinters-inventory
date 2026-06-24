import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const prismaDir = path.join(projectRoot, "prisma");
const envPath = path.join(projectRoot, ".env");
const backupDir = path.join(projectRoot, "backups");

function fail(message) {
  console.error(`Backup failed: ${message}`);
  process.exit(1);
}

function parseEnv(content) {
  const values = new Map();

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);

    if (!match) {
      continue;
    }

    let value = match[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values.set(match[1], value);
  }

  return values;
}

function getDatabaseUrl() {
  if (!fs.existsSync(envPath)) {
    fail(`.env not found at ${envPath}`);
  }

  const env = parseEnv(fs.readFileSync(envPath, "utf8"));
  const databaseUrl = env.get("DATABASE_URL");

  if (!databaseUrl) {
    fail("DATABASE_URL is missing in .env");
  }

  return databaseUrl;
}

function getSqlitePathFromUrl(databaseUrl) {
  if (!databaseUrl.startsWith("file:")) {
    fail(
      `DATABASE_URL must be a SQLite file URL like file:./dev.db. Got: ${databaseUrl}`
    );
  }

  const rawPath = databaseUrl.slice("file:".length).split("?")[0];

  if (!rawPath) {
    fail(`DATABASE_URL has no file path. Got: ${databaseUrl}`);
  }

  try {
    return decodeURIComponent(rawPath);
  } catch {
    fail(`DATABASE_URL file path is not valid URI encoding: ${rawPath}`);
  }
}

function getDatabasePath(databaseUrl) {
  const sqlitePath = getSqlitePathFromUrl(databaseUrl);
  const candidates = path.isAbsolute(sqlitePath)
    ? [sqlitePath]
    : [
        path.resolve(prismaDir, sqlitePath),
        path.resolve(projectRoot, sqlitePath)
      ];

  const databasePath = candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()
  );

  if (!databasePath) {
    fail(
      [
        `SQLite database file was not found for DATABASE_URL=${databaseUrl}.`,
        "Checked:",
        ...candidates.map((candidate) => `- ${candidate}`)
      ].join("\n")
    );
  }

  return databasePath;
}

function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function getBackupPath(databasePath) {
  const parsed = path.parse(databasePath);
  const baseName = parsed.name || "database";
  const extension = parsed.ext || ".db";

  return path.join(backupDir, `${baseName}-${getTimestamp()}${extension}`);
}

function main() {
  const databaseUrl = getDatabaseUrl();
  const databasePath = getDatabasePath(databaseUrl);
  const backupPath = getBackupPath(databasePath);

  fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(databasePath, backupPath, fs.constants.COPYFILE_EXCL);

  console.log(`Database: ${databasePath}`);
  console.log(`Backup created: ${backupPath}`);
}

main();
