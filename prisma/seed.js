const { PrismaClient, MovementKind, MovementReason } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();
const RESET_DEMO_DATA = process.env.RESET_DEMO_DATA === "1";

function requireEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env before running seed.`
    );
  }

  return value;
}

const PIN_HASH_SECRET = requireEnv("PIN_HASH_SECRET");

function hashPin(pin) {
  return crypto.createHmac("sha256", PIN_HASH_SECRET).update(pin).digest("hex");
}

async function getExistingDataCounts() {
  const [stockMovements, supplies, barcodes, products, employees] =
    await prisma.$transaction([
      prisma.stockMovement.count(),
      prisma.supply.count(),
      prisma.barcode.count(),
      prisma.product.count(),
      prisma.employee.count()
    ]);

  return {
    stockMovements,
    supplies,
    barcodes,
    products,
    employees
  };
}

function hasExistingBusinessData(counts) {
  return Object.values(counts).some((count) => count > 0);
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run destructive demo seed in production.");
  }

  const existingDataCounts = await getExistingDataCounts();

  if (hasExistingBusinessData(existingDataCounts) && !RESET_DEMO_DATA) {
    throw new Error(
      "Refusing to overwrite existing business data. Use RESET_DEMO_DATA=1 only for a local demo database that can be wiped."
    );
  }

  if (RESET_DEMO_DATA) {
    await prisma.stockMovement.deleteMany();
    await prisma.supply.deleteMany();
    await prisma.barcode.deleteMany();
    await prisma.product.deleteMany();
    await prisma.employee.deleteMany();
  }

  const [anna, boris] = await Promise.all([
    prisma.employee.create({
      data: {
        name: "Анна",
        role: "manager",
        pinHash: hashPin("1111")
      }
    }),
    prisma.employee.create({
      data: {
        name: "Борис",
        role: "worker",
        pinHash: hashPin("2222")
      }
    })
  ]);

  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Держатель катушки настенный, черный",
        internalSku: "FBO-SPOOL-HOLDER-BLK",
        ozonOfferId: "OZ-SPOOL-BLK",
        category: "Органайзеры",
        isFavorite: true,
        searchAliases: "катушка держак spool holder пластик черный",
        barcodes: {
          create: [{ value: "4600000000011" }, { value: "FBO1001" }]
        }
      }
    }),
    prisma.product.create({
      data: {
        name: "Клипса для кабеля 10 мм, набор 20 шт",
        internalSku: "FBO-CABLE-CLIP-10",
        ozonOfferId: "OZ-CLIP-10-20",
        category: "Крепеж",
        isFavorite: true,
        searchAliases: "кабель провод клипса зажим 10мм",
        barcodes: {
          create: [{ value: "4600000000028" }, { value: "FBO1002" }]
        }
      }
    }),
    prisma.product.create({
      data: {
        name: "Органайзер для бит, 24 ячейки",
        internalSku: "FBO-BIT-ORG-24",
        ozonOfferId: "OZ-BIT-ORG-24",
        category: "Инструменты",
        searchAliases: "биты отвертка holder organizer",
        barcodes: {
          create: [{ value: "4600000000035" }, { value: "FBO1003" }]
        }
      }
    }),
    prisma.product.create({
      data: {
        name: "Уголок монтажный усиленный 40x40",
        internalSku: "FBO-BRACKET-4040",
        ozonOfferId: "OZ-BRACKET-4040",
        category: "Крепеж",
        searchAliases: "кронштейн угол крепление bracket",
        barcodes: {
          create: [{ value: "4600000000042" }, { value: "FBO1004" }]
        }
      }
    })
  ]);

  await prisma.stockMovement.createMany({
    data: [
      {
        productId: products[0].id,
        employeeId: anna.id,
        kind: MovementKind.ADD,
        quantityDelta: 18,
        reason: MovementReason.READY_PRODUCT,
        comment: "Стартовый остаток"
      },
      {
        productId: products[1].id,
        employeeId: anna.id,
        kind: MovementKind.ADD,
        quantityDelta: 45,
        reason: MovementReason.READY_PRODUCT,
        comment: "Стартовый остаток"
      },
      {
        productId: products[2].id,
        employeeId: boris.id,
        kind: MovementKind.ADD,
        quantityDelta: 12,
        reason: MovementReason.READY_PRODUCT,
        comment: "Стартовый остаток"
      },
      {
        productId: products[3].id,
        employeeId: boris.id,
        kind: MovementKind.ADD,
        quantityDelta: 30,
        reason: MovementReason.READY_PRODUCT,
        comment: "Стартовый остаток"
      },
      {
        productId: products[1].id,
        employeeId: anna.id,
        kind: MovementKind.REMOVE,
        quantityDelta: -5,
        reason: MovementReason.OZON_SUPPLY,
        comment: "Тестовая поставка FBO"
      }
    ]
  });

  console.log("Demo seed completed.");
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
