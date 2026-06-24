export type ProductForPicker = {
  id: string;
  name: string;
  internalSku: string;
  ozonOfferId: string | null;
  category: string;
  searchAliases: string;
  stock: number;
  barcodes: Array<{
    value: string;
  }>;
};
