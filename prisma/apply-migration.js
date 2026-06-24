const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const LOCAL_MIGRATIONS_TABLE = "_local_migrations";

function getStatements(sql) {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function getMigrations() {
  const migrationsPath = path.join(__dirname, "migrations");

  return fs
    .readdirSync(migrationsPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      path: path.join(migrationsPath, entry.name, "migration.sql")
    }))
    .filter((migration) => fs.existsSync(migration.path))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function isAlreadyAppliedError(message) {
  return (
    message.includes("already exists") ||
    message.includes("duplicate column name")
  );
}

async function ensureLocalMigrationsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${LOCAL_MIGRATIONS_TABLE}" (
      "name" TEXT NOT NULL PRIMARY KEY,
      "applied_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrationNames() {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT "name" FROM "${LOCAL_MIGRATIONS_TABLE}"`
  );

  return new Set(rows.map((row) => row.name));
}

async function recordAppliedMigration(name) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "${LOCAL_MIGRATIONS_TABLE}" ("name") VALUES (?)`,
    name
  );
}

async function applyMigration(migration) {
  const sql = fs.readFileSync(migration.path, "utf8");
  let executedStatements = 0;
  let alreadyAppliedStatements = 0;

  for (const statement of getStatements(sql)) {
    try {
      await prisma.$executeRawUnsafe(statement);
      executedStatements += 1;
    } catch (error) {
      const message = String(error.message || error);

      if (!isAlreadyAppliedError(message)) {
        throw error;
      }

      alreadyAppliedStatements += 1;
    }
  }

  await recordAppliedMigration(migration.name);

  if (alreadyAppliedStatements > 0 && executedStatements === 0) {
    console.log(`applied: ${migration.name} (recorded existing changes)`);
    return;
  }

  if (alreadyAppliedStatements > 0) {
    console.log(
      `applied: ${migration.name} (${executedStatements} statement(s), ${alreadyAppliedStatements} already present)`
    );
    return;
  }

  console.log(`applied: ${migration.name}`);
}

async function main() {
  await ensureLocalMigrationsTable();

  const migrations = getMigrations();
  const appliedMigrationNames = await getAppliedMigrationNames();

  let appliedCount = 0;
  let skippedCount = 0;

  for (const migration of migrations) {
    if (appliedMigrationNames.has(migration.name)) {
      console.log(`skipped: ${migration.name}`);
      skippedCount += 1;
      continue;
    }

    await applyMigration(migration);
    appliedMigrationNames.add(migration.name);
    appliedCount += 1;
  }

  console.log(
    `Done. Applied ${appliedCount} migration(s), skipped ${skippedCount} migration(s).`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
