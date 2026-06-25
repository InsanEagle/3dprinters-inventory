export type ProductForPicker = {
  id: string;
  name: string;
  internalSku: string;
  ozonOfferId: string | null;
  category: string;
  imageUrl: string | null;
  searchAliases: string;
  isFavorite: boolean;
  stock: number;
  barcodes: Array<{
    value: string;
  }>;
};
