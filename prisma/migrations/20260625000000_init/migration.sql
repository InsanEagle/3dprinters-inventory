-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "internal_sku" TEXT NOT NULL,
    "ozon_offer_id" TEXT,
    "category" TEXT NOT NULL,
    "search_aliases" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Barcode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Barcode_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "pin_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'worker',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Supply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT,
    "destination" TEXT NOT NULL,
    "reference" TEXT,
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Supply_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "supply_id" TEXT,
    "kind" TEXT NOT NULL,
    "quantity_delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_supply_id_fkey" FOREIGN KEY ("supply_id") REFERENCES "Supply" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_internal_sku_key" ON "Product"("internal_sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_ozon_offer_id_key" ON "Product"("ozon_offer_id");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Barcode_value_key" ON "Barcode"("value");

-- CreateIndex
CREATE INDEX "Barcode_product_id_idx" ON "Barcode"("product_id");

-- CreateIndex
CREATE INDEX "Supply_product_id_idx" ON "Supply"("product_id");

-- CreateIndex
CREATE INDEX "Supply_created_at_idx" ON "Supply"("created_at");

-- CreateIndex
CREATE INDEX "StockMovement_product_id_created_at_idx" ON "StockMovement"("product_id", "created_at");

-- CreateIndex
CREATE INDEX "StockMovement_employee_id_created_at_idx" ON "StockMovement"("employee_id", "created_at");

-- CreateIndex
CREATE INDEX "StockMovement_reason_idx" ON "StockMovement"("reason");
