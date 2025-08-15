// utils/barcode.ts
export function generateBarcode(): string {
  return String(Math.floor(100000000000 + Math.random() * 900000000000)); // 12-digit numeric
}
