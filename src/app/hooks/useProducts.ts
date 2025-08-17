import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Product {
  _id: string;
  name: string;
  description: string;
  totalSold: number;
  sellingPrice: number;
  cost: number;
  totalQuantity: number;
  category: { name: string };
  sku: string;
  barcode: string;
  imageUrl: string;
  inStock: boolean;
  stockLevel: "high" | "low" | "out";
}

interface ProductSummary {
  totalProducts: number;
  inStockCount: number;
  outOfStockCount: number;
  lowStockCount: number;
  highStockCount: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ProductResponse {
  summary: ProductSummary;
  products: Product[];
  pagination: PaginationInfo;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<ProductSummary | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [barcode, setBarcode] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch products with pagination and filters
  const fetchProducts = async (
    search = "",
    barcodeValue: string | null = null,
    stockFilterValue: string | null = null,
    page = 1
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (barcodeValue) {
        query.append("barcode", barcodeValue);
      } else if (search) {
        query.append("search", search);
      }
      if (stockFilterValue) {
        query.append("stock", stockFilterValue);
      }
      query.append("page", page.toString());
      query.append("limit", "10"); // Fixed limit of 10

      const response = await fetch(`/api/products/all-products?${query.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: ProductResponse = await response.json();
      setProducts(data.products);
      setSummary(data.summary);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch products";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Failed to fetch products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Refetch when filters change (with debounce for search)
  useEffect(() => {
    if (!barcode) {
      const timeoutId = setTimeout(() => {
        fetchProducts(searchTerm, null, stockFilter, 1);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, stockFilter, barcode]);

  // Refetch when barcode changes
  useEffect(() => {
    if (barcode) {
      fetchProducts("", barcode, null, 1);
    }
  }, [barcode]);

  // Pagination functions
  const goToPage = (page: number) => {
    fetchProducts(searchTerm, barcode, stockFilter, page);
  };

  const nextPage = () => {
    if (pagination && pagination.hasNext) {
      goToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (pagination && pagination.hasPrev) {
      goToPage(currentPage - 1);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setBarcode(null);
    setStockFilter(null);
    goToPage(1);
  };

  // Helpers
  const refreshProducts = () => fetchProducts(searchTerm, barcode, stockFilter, currentPage);
  const addProduct = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
    // Update summary if needed
    if (summary) {
      setSummary({
        ...summary,
        totalProducts: summary.totalProducts + 1,
        inStockCount: newProduct.inStock ? summary.inStockCount + 1 : summary.inStockCount,
        outOfStockCount: !newProduct.inStock ? summary.outOfStockCount + 1 : summary.outOfStockCount,
        lowStockCount: newProduct.stockLevel === "low" ? summary.lowStockCount + 1 : summary.lowStockCount,
        highStockCount: newProduct.stockLevel === "high" ? summary.highStockCount + 1 : summary.highStockCount,
      });
    }
  };
  
  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => (p._id === updatedProduct._id ? updatedProduct : p)));
    // Update summary if needed
    if (summary) {
      const oldProduct = products.find(p => p._id === updatedProduct._id);
      if (oldProduct) {
        setSummary({
          ...summary,
          inStockCount: updatedProduct.inStock 
            ? summary.inStockCount + (oldProduct.inStock ? 0 : 1)
            : summary.inStockCount - (oldProduct.inStock ? 1 : 0),
          outOfStockCount: !updatedProduct.inStock 
            ? summary.outOfStockCount + (oldProduct.inStock ? 1 : 0)
            : summary.outOfStockCount - (oldProduct.inStock ? 0 : 1),
          lowStockCount: updatedProduct.stockLevel === "low" 
            ? summary.lowStockCount + (oldProduct.stockLevel === "low" ? 0 : 1)
            : summary.lowStockCount - (oldProduct.stockLevel === "low" ? 1 : 0),
          highStockCount: updatedProduct.stockLevel === "high" 
            ? summary.highStockCount + (oldProduct.stockLevel === "high" ? 0 : 1)
            : summary.highStockCount - (oldProduct.stockLevel === "high" ? 1 : 0),
        });
      }
    }
  };
  
  const removeProduct = (id: string) => {
    const productToRemove = products.find(p => p._id === id);
    setProducts(prev => prev.filter(p => p._id !== id));
    // Update summary if needed
    if (summary && productToRemove) {
      setSummary({
        ...summary,
        totalProducts: summary.totalProducts - 1,
        inStockCount: productToRemove.inStock ? summary.inStockCount - 1 : summary.inStockCount,
        outOfStockCount: !productToRemove.inStock ? summary.outOfStockCount - 1 : summary.outOfStockCount,
        lowStockCount: productToRemove.stockLevel === "low" ? summary.lowStockCount - 1 : summary.lowStockCount,
        highStockCount: productToRemove.stockLevel === "high" ? summary.highStockCount - 1 : summary.highStockCount,
      });
    }
  };

  return {
    products,
    summary,
    pagination,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    barcode,
    setBarcode,
    stockFilter,
    setStockFilter,
    currentPage,
    goToPage,
    nextPage,
    prevPage,
    clearFilters,
    fetchProducts,
    refreshProducts,
    addProduct,
    updateProduct,
    removeProduct,
  };
}