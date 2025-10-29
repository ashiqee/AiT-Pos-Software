// app/dashboard/purchase/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  Plus,
  Minus,
  Trash2,
  Save,
  Package,
  Search,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {  NumberInput, ScrollShadow } from "@heroui/react";
import Image from "next/image";

interface Product {
  _id: string;
  name: string;
  sku: string;
  barcode: string;
  sellingPrice: number;
  availableStock: number;
  category: { name: string };
  imageUrl: string;
}

interface PurchaseItem {
  product: Product;
  quantity: number;
  unitCost: number;
  supplier: string;
  batchNumber?: string;
  purchaseDate: Date;
}

export default function PurchasePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [supplier, setSupplier] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const router = useRouter();

 

  // Fetch products
  const fetchProducts = async (search = "") => {
    try {
      const response = await fetch(`/api/products?search=${search}`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to fetch products");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Trigger search with debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Add product to purchase list
  const addToPurchase = (product: Product) => {
    // Check if product already in purchase list
    const existingItem = purchaseItems.find(
      (item) => item.product._id === product._id
    );

    if (existingItem) {
      toast.error("Product already in purchase list");
      return;
    }


    setPurchaseItems([
      ...purchaseItems,
      {
        product,
        quantity: 1,
        unitCost: 0,
        supplier: supplier,
        purchaseDate: new Date(),
      },
    ]);
  };

  // Update quantity in purchase list
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromPurchase(productId);
      return;
    }

    setPurchaseItems(
      purchaseItems.map((item) =>
        item.product._id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Update unit cost in purchase list
  const updateUnitCost = (productId: string, unitCost: number) => {
    setPurchaseItems(
      purchaseItems.map((item) =>
        item.product._id === productId ? { ...item, unitCost } : item
      )
    );
  };

  // Update supplier in purchase list
  const updateSupplier = (productId: string, supplier: string) => {
    setPurchaseItems(
      purchaseItems.map((item) =>
        item.product._id === productId ? { ...item, supplier } : item
      )
    );
  };

  // Update batch number in purchase list
  const updateBatchNumber = (productId: string, batchNumber: string) => {
    setPurchaseItems(
      purchaseItems.map((item) =>
        item.product._id === productId ? { ...item, batchNumber } : item
      )
    );
  };

  // Remove item from purchase list
  const removeFromPurchase = (productId: string) => {
    setPurchaseItems(
      purchaseItems.filter((item) => item.product._id !== productId)
    );
  };

  // Calculate totals
  const subtotal = purchaseItems.reduce(
    (sum, item) => sum + item.unitCost * item.quantity,
    0
  );
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  // Process purchase
  const processPurchase = async () => {
    if (purchaseItems.length === 0) {
      toast.error("No items in purchase list");
      return;
    }

    
    
    // Validate all items
    for (const item of purchaseItems) {
        console.log(item);
      if (item.unitCost <= 0) {
        toast.error(`Unit cost must be greater than 0 for ${item.product.name}`);
        return;
      }
      if (item.quantity <= 0) {
        toast.error(`Quantity must be greater than 0 for ${item.product.name}`);
        return;
      }
      if (!supplier) {
        toast.error(`Supplier is required for ${item.product.name}`);
        return;
      }
    }

    setIsProcessing(true);
    try {
      const purchaseData = {
        items: purchaseItems.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          unitCost: item.unitCost,
          supplier: supplier,
          batchNumber: item.batchNumber || "",
          purchaseDate: item.purchaseDate,
        })),
        subtotal,
        tax,
        total,
        invoiceNumber,
        notes,
      };

      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchaseData),
      });

      if (response.ok) {
        toast.success("Purchase processed successfully");
        setPurchaseItems([]);
        setSupplier("");
        setInvoiceNumber("");
        setNotes("");
        router.push("/dashboard/purchases");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to process purchase");
      }
    } catch (error) {
      console.error("Error processing purchase:", error);
      toast.error("Failed to process purchase");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div >
      <div className="mb-4">
        <h1 className="lg:text-2xl text-md font-bold">Product Purchase</h1>
        <p className="text-gray-600 text-xs">Restock products by creating a purchase order</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Products Section */}
        <div className="lg:w-2/3 ">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Products</h2>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 right-0 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
              <ScrollShadow hideScrollBar className="md:h-[380px] h-60 2xl:h-[72vh]">
            <CardBody >
 <div className="grid grid-cols-1  md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <Card
                    key={product._id}
                    isPressable
                    className="cursor-pointer hover:shadow rounded-md "
                    onPress={() => addToPurchase(product)}
                  >
                    <CardBody className="p-4 ">
                      <div className="flex justify-between items-start">
                        <div className="w-full">
                          <h3 className="font-medium text-xs">{product.name}</h3>
                          <p className="text-md text-sky-600">SKU: {product.sku}</p>
                          <p className="text-xs hidden text-gray-600">Barcode: {product.barcode}</p>
                        {product.category.name &&  <p className="text-xs text-gray-600">
                            Category: {product.category.name}
                          </p>
                            }
                          <p className="font-bold text-xs mt-1">
                            Selling Price: &#x09F3;{product.sellingPrice.toFixed(2)}
                          </p>
                          <p className="text-xs mt-1">
                            Current Stock: {product.availableStock}
                          </p>
                        </div>
                     <div className="flex flex-col justify-center items-center">
                           <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="primary"
                          onPress={() => addToPurchase(product)}
                        >
                          <Plus size={16} />
                        </Button>
                        <Image
                        width={400} 
                        height={400}
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-12 rounded-md z-0 h-12 object-cover"
                       
                        />
                     </div>

                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
             
            </CardBody>
              </ScrollShadow>
          </Card>
        </div>

        {/* Purchase List Section */}
        <div className="lg:w-1/3">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Package size={20} />
                Purchase List ({purchaseItems.length})
              </h2>
            </CardHeader>
            <CardBody>
              {purchaseItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No items in purchase list</p>
                  <p className="text-sm">Add products from the list</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex gap-3">
                    <Input
                      label="Default Supplier"
                      placeholder="Enter supplier name"
                      value={supplier}
                      onValueChange={setSupplier}
                    />
                     <Input
                     
                      label="Invoice Number"
                      placeholder="Enter invoice number"
                      value={invoiceNumber}
                      onValueChange={setInvoiceNumber}
                    />
                  </div>
                  
                  <div className="mb-4 flex gap-3">
                    <NumberInput
                    hideStepper
                      label="Tax Rate (%)"
                      placeholder="Enter tax rate"
                      type="number"
                      size="sm"
                      minValue={0}
                      defaultValue={taxRate}
                      onValueChange={(value) => setTaxRate(value || 0)}
                    />

                      
                    <Input
                      label="Notes"
                      size="sm"
                      placeholder="Enter notes (optional)"
                      value={notes}
                      onValueChange={setNotes}
                    />
                  
                  </div>
               
                  <Divider className="my-4" />
                  <div >
                    <ScrollShadow hideScrollBar className="h-96 overflow-y-auto">
                    <Table isHeaderSticky aria-label="Purchase items" radius="sm">
                      <TableHeader>
                        <TableColumn>Product</TableColumn>
                        <TableColumn>Qty</TableColumn>
                        <TableColumn>Cost</TableColumn>
                        <TableColumn>Total</TableColumn>
                        <TableColumn>Action</TableColumn>
                      </TableHeader>
                      
 <TableBody >
                        {purchaseItems.map((item) => (
                          <TableRow
  key={item.product._id}

>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">
                                  {item.product.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.product.sku}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  onPress={() =>
                                    updateQuantity(
                                      item.product._id,
                                      item.quantity - 1
                                    )
                                  }
                                >
                                  <Minus size={16} />
                                </Button>
                                <Input
                                
                                  
                                  min={1}
                                  size="sm"
                                  value={item.quantity.toString()}
                                  onValueChange={(value) =>
                                    updateQuantity(
                                      item.product._id,
                                      parseFloat(value) || 1
                                    )
                                  }
                                  className="w-12 text-center"
                                />
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  onPress={() =>
                                    updateQuantity(
                                      item.product._id,
                                      item.quantity + 1
                                    )
                                  }
                                >
                                  <Plus size={16} />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <NumberInput
                              hideStepper
                                type="number"
                                minValue={0}
                                size="sm"
                            
                                defaultValue={item.unitCost}
                                onValueChange={(value) =>
                                  updateUnitCost(
                                    item.product._id,
                                    value || 0
                                  )
                                }
                                className="w-20"
                                startContent="&#x09F3;"
                              />
                            </TableCell>
                            <TableCell>
                                  &#x09F3;{(item.unitCost * item.quantity).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => removeFromPurchase(item.product._id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>     
                     
                    </Table>
                      </ScrollShadow>
                  </div>
                  <Divider className="my-4" />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>&#x09F3;{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({taxRate}%):</span>
                      <span>&#x09F3;{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>&#x09F3;{total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button
                      color="primary"
                      onPress={processPurchase}
                      isLoading={isProcessing}
                      startContent={<Save size={16} />}
                      className="w-full"
                    >
                      Process Purchase
                    </Button>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}