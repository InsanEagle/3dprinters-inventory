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

async function main() {
  const migrationPath = path.join(
    __dirname,
    "migrations",
    "20260625000000_init",
    "migration.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf8");

  for (const statement of getStatements(sql)) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (error) {
      const message = String(error.message || error);

      if (!message.includes("already exists")) {
        throw error;
      }
    }
  }
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
