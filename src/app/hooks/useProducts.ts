import { useState, useEffect } from 'react';
import { toast } from 'sonner';


interface Product {
  _id: string;
  name: string;
  description: string;
   sellingPrice: number;
  cost: number;
  totalQuantity: number;
  category: { name: string };
  sku: string;
  barcode: string;
  imageUrl: string;
  inStock: boolean;
  stockLevel: string;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch products with optional search parameter
  const fetchProducts = async (search = '') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Failed to fetch products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Refetch when search term changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Function to refresh products list
  const refreshProducts = () => {
    fetchProducts(searchTerm);
  };

  // Function to add a new product to the list
  const addProduct = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
  };

  // Function to update a product in the list
  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => 
      prev.map(product => 
        product._id === updatedProduct._id ? updatedProduct : product
      )
    );
  };

  // Function to remove a product from the list
  const removeProduct = (productId: string) => {
    setProducts(prev => prev.filter(product => product._id !== productId));
  };

  return {
    products,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    fetchProducts,
    refreshProducts,
    addProduct,
    updateProduct,
    removeProduct
  };
}