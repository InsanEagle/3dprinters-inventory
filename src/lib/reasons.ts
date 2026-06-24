export const reasonLabels = {
  READY_PRODUCT: "Готовый товар",
  OZON_SUPPLY: "Поставка Ozon",
  FBS: "FBS",
  YANDEX: "Яндекс",
  AVITO: "Авито",
  CDEK: "СДЭК",
  DEFECT: "Брак",
  REWORK: "Доработка",
  OTHER: "Другое",
  INVENTORY_CORRECTION: "Коррекция"
} as const;

export const kindLabels = {
  ADD: "Приход",
  REMOVE: "Расход",
  CORRECTION: "Коррекция"
} as const;

export const removeReasonOptions = [
  { value: "OZON_SUPPLY", label: reasonLabels.OZON_SUPPLY },
  { value: "FBS", label: reasonLabels.FBS },
  { value: "YANDEX", label: reasonLabels.YANDEX },
  { value: "AVITO", label: reasonLabels.AVITO },
  { value: "CDEK", label: reasonLabels.CDEK },
  { value: "DEFECT", label: reasonLabels.DEFECT },
  { value: "REWORK", label: reasonLabels.REWORK },
  { value: "OTHER", label: reasonLabels.OTHER }
] as const;

export function getReasonLabel(reason: string) {
  return reasonLabels[reason as keyof typeof reasonLabels] ?? reason;
}

export function getKindLabel(kind: string) {
  return kindLabels[kind as keyof typeof kindLabels] ?? kind;
}
