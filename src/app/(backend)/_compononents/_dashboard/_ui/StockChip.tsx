import { Chip } from "@heroui/react";


export function StockChip({ stockLevel }: { stockLevel: string }) {
  const color =
    stockLevel === "out"
      ? "danger"
      : stockLevel === "high"
      ? "success"
      : "warning";

  return (
    <Chip
      color={color}
      variant="flat"
      className="capitalize"
    >
      {stockLevel}
    </Chip>
  );
}
