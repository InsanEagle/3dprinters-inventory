const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function getStatements(sql) {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function getMigrationFiles() {
  const migrationsPath = path.join(__dirname, "migrations");

  return fs
    .readdirSync(migrationsPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(migrationsPath, entry.name, "migration.sql"))
    .filter((migrationPath) => fs.existsSync(migrationPath))
    .sort();
}

function isAlreadyAppliedError(message) {
  return (
    message.includes("already exists") ||
    message.includes("duplicate column name")
  );
}

async function main() {
  const migrationFiles = getMigrationFiles();

  for (const migrationPath of migrationFiles) {
    const sql = fs.readFileSync(migrationPath, "utf8");

    for (const statement of getStatements(sql)) {
      try {
        await prisma.$executeRawUnsafe(statement);
      } catch (error) {
        const message = String(error.message || error);

        if (!isAlreadyAppliedError(message)) {
          throw error;
        }
      }
    }
  }

  console.log(`Applied ${migrationFiles.length} migration file(s).`);
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
