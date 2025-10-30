"use client";
import { useState, useEffect } from "react";

interface Product {
  description: string;
  imageUrl: any;
  _id: string;
  name: string;
  sku: string;
  barcode: string;
  totalQuantity: number;
  inStock: boolean;
  stockLevel: "high" | "low" | "out";
}

export function useAllProducts(search?: string, barcode?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (barcode) params.append("barcode", barcode);

        const res = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data);
        setError(null);
      } catch (err: any) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 500); // debounce 500ms

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [search, barcode]);

  return { products, loading, error };
}
