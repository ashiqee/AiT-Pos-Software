"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Select, SelectItem } from "@heroui/select";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Badge } from "@heroui/badge";
import {
  ShoppingCart,
  Plus,
  Minus,
  CreditCard,
  DollarSign,
  Printer,
  Minimize2,
  Maximize2,
  Edit,
} from "lucide-react";
import Image from "next/image";
import ProfileBar from "@/components/shared/ProfileBar";
import { addToast, NumberInput, ScrollShadow } from "@heroui/react";
import { ThemeSwitch } from "@/components/theme-switch";

interface CartProduct {
  _id: string;
  name: string;
  imageUrl: string;
  barcode: string;
  sellingPrice: number;
  availableStock: number;
  inStock: boolean;
  stockLevel: string;
  category: { name: string };
  sku: string;
}

interface CartItem {
  product: CartProduct;
  quantity: number;
  customPrice?: number; // Add custom price field
}

export default function POSPage() {
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [receiptData, setReceiptData] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPartialPay, setIsPartialPay] = useState(false);
  
  // New states for price modal
  const [selectedProduct, setSelectedProduct] = useState<CartProduct | null>(null);
  const [customPrice, setCustomPrice] = useState<string>("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>("");
  const { isOpen: isPriceModalOpen, onOpen: onPriceModalOpen, onClose: onPriceModalClose } = useDisclosure();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Fetch products
  const fetchProducts = async (search = "") => {
    try {
      const response = await fetch(`/api/products?search=${search}`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => {
      const price = item.customPrice || item.product.sellingPrice;
      return sum + price * item.quantity;
    },
    0
  );
  const tax = subtotal * 0.08;
  const total = Math.round(subtotal + tax - discount).toFixed(2);

  useEffect(() => {
    fetchProducts(); // initial load
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(()=>{
      setAmountPaid(total); // initial load
    },300)
    return ()=>clearTimeout(delayDebounce);
  }, [total]);

  // Trigger search with debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Open price modal when product is clicked
  const handleProductClick = (product: CartProduct) => {
    if (product.availableStock > 0) {
      setSelectedProduct(product);
      setCustomPrice(product.sellingPrice.toString());
      onPriceModalOpen();
    }
  };

  // Add product to cart with custom price
  const addToCartWithPrice = () => {
    if (!selectedProduct) return;
    
    const price = parseFloat(customPrice) || selectedProduct.sellingPrice;
    
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product._id === selectedProduct._id
      );

      if (existingItem) {
        return prevCart.map((item) =>
          item.product._id === selectedProduct._id
            ? { ...item, quantity: item.quantity + 1, customPrice: price }
            : item
        );
      } else {
        addToast({
          title: selectedProduct.name
        });
        return [...prevCart, { product: selectedProduct, quantity: 1, customPrice: price }];
      }
    });
    
    onPriceModalClose();
    setSelectedProduct(null);
    setCustomPrice("");
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Update quantity in cart
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product._id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product._id !== productId)
    );
  };

  // Start editing price
  const startEditingPrice = (itemId: string, currentPrice: number) => {
    setEditingItemId(itemId);
    setEditingPrice(currentPrice.toString());
  };

  // Save edited price
  const saveEditedPrice = () => {
    if (!editingItemId) return;
    
    const newPrice = parseFloat(editingPrice);
    if (isNaN(newPrice) || newPrice <= 0) return;
    
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product._id === editingItemId
          ? { ...item, customPrice: newPrice }
          : item
      )
    );
    
    setEditingItemId(null);
    setEditingPrice("");
  };

  // Cancel editing price
  const cancelEditingPrice = () => {
    setEditingItemId(null);
    setEditingPrice("");
  };

  // Calculate due amount and change
  const amountPaidNum = parseFloat(amountPaid) || 0;
  const totalNum = parseFloat(total);
  const dueAmount = Math.max(0, totalNum - amountPaidNum);
  const change =
    paymentMethod === "cash" && cashReceived
      ? parseFloat(cashReceived) - amountPaidNum
      : 0;

  // Process sale
  const processSale = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);

    try {
      const saleData = {
        items: cart.map((item) => {
          const price = item.customPrice || item.product.sellingPrice;
          return {
            product: item.product._id,
            quantity: item.quantity,
            price: price,
            total: price * item.quantity,
          };
        }),
        subtotal,
        discount,
        tax,
        total: totalNum,
        paymentMethod,
        amountPaid: amountPaidNum,
        customer: {
          customerName: customerName || "Walk-in Customer",
          customerMobile,
        },
      };

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      });

      if (response.ok) {
        const sale = await response.json();
        setReceiptData(sale);
        onOpen();
        setCart([]);
        setAmountPaid("");
        setCustomerMobile("");
        setCustomerName("");
        fetchProducts();
      } else {
        console.error("Failed to process sale");
      }
    } catch (error) {
      console.error("Error processing sale:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Print receipt
  const printReceipt = () => {
    window.print();
  };

  // Determine button text based on payment status
  const buttonText = isPartialPay ? "Process Partial Payment" : "Process Sale";

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-3 mb-3">
        <div>
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          <p className="text-gray-600">Process sales and manage transactions</p>
        </div>
        <div className="w-full ml-0 md:ml-28 md:w-80">
          <Input
            placeholder="Search by name or SKU..."
            value={searchTerm}
            variant="bordered"
            onValueChange={setSearchTerm}
            size="lg"
          />
        </div>
        <div className="absolute md:relative flex gap-4 items-center top-6 md:top-0 right-5">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hidden md:block hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <ThemeSwitch/>
          <ProfileBar />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-grow">
        {/* Products Section */}
        <div className="2xl:w-2/3 md:w-[50rem]">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Products</h2>
            </CardHeader>
            <ScrollShadow hideScrollBar className={`${isFullscreen ? "h-[64vh]" :"h-[54vh] "}`}>
              <CardBody>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {products?.map((product) => (
                    <Card
                      key={product._id}
                      isPressable={product?.availableStock > 0}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${
                        product?.availableStock < 1
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      onPress={() => handleProductClick(product)}
                    >
                      <CardBody className="p-4 text-center">
                        <div className="mb-2">
                          <div className="rounded-lg flex items-center justify-center">
                            {product.imageUrl ? (
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                width={500}
                                height={500}
                                className="object-cover h-28 rounded-xl w-full"
                              />
                            ) : (
                              <span className="text-gray-500">
                                Product Image
                              </span>
                            )}
                          </div>
                        </div>
                        <h3 className="font-medium text-xs truncate">
                          {product?.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {product?.category?.name}
                        </p>
                        <p className="font-bold hidden text-lg mt-1">
                          ৳{product.sellingPrice.toFixed(2)}
                        </p>
                        <div className="md:flex-row flex flex-col gap-1 items-center justify-between w-full">
                          <p
                            className={`mt-2 text-[10px] p-1 px-2 font-light rounded-md ${product?.availableStock < 1 ? "bg-red-700/75 " : "bg-green-700 "}`}
                          >
                            {product?.availableStock} in stock
                          </p>
                          <p className="text-[10px] bg-amber-50/5 p-1 px-2 rounded-md">
                            SKU-{product.sku}
                          </p>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </CardBody>
            </ScrollShadow>
          </Card>
        </div>

        {/* Cart Section */}
        <div className="2xl:w-1/3 md:w-[40rem]">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart size={20} />
                Shopping Cart ({totalItems})
              </h2>
            </CardHeader>
            <ScrollShadow hideScrollBar className="h-[54vh]">
              <CardBody className="flex-grow flex flex-col">
                {cart.length === 0 ? (
                  <div className="flex-grow flex items-center justify-center text-gray-500">
                    Your cart is empty
                  </div>
                ) : (
                  <>
                    <div className="flex-grow">
                      <Table aria-label="Cart items">
                        <TableHeader className="sticky">
                          <TableColumn>Item</TableColumn>
                         
                          <TableColumn>Qty | Unit price</TableColumn>
                          <TableColumn>Total</TableColumn>
                          <TableColumn>Action</TableColumn>
                        </TableHeader>
                        <TableBody>
                          {cart.map((item, i) => {
                            const price = item.customPrice || item.product.sellingPrice;
                            const isEditing = editingItemId === item.product._id;
                            
                            return (
                              <TableRow key={item.product._id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{i + 1}.</span>
                                    <div className="md:flex gap-1.5">
                                      {item.product.imageUrl && (
                                      <Image
                                        src={item.product.imageUrl}
                                        alt={item.product.name}
                                        width={400}
                                        height={400}
                                        className="w-12 h-12 rounded-md object-cover"
                                      />
                                    )}
                                    <div className="font-medium min-w-28 text-[12px]">
                                      {item.product.name}
                                      <div className="text-[10px] flex items-center gap-3 dark:text-gray-200 text-gray-500">
                                        <span>{item.product.sku}</span>
                                        {item.customPrice && (
                                          <span className="text-blue-500 hidden">Custom Price</span>
                                        )}
                                      </div>
                                    </div>
                                    </div>
                                  </div>
                                </TableCell>
                               
                                <TableCell>
                                  {isEditing ? (
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        size="sm"
                                        value={editingPrice}
                                        onValueChange={setEditingPrice}
                                        className="w-20"
                                      />
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        color="success"
                                        onPress={saveEditedPrice}
                                      >
                                        ✓
                                      </Button>
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        color="danger"
                                        onPress={cancelEditingPrice}
                                      >
                                        ✕
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center">
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
                                    <span className="w-8 text-center">
                                      {item.quantity}
                                    </span>
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      isDisabled={
                                        item.quantity >=
                                        item.product.availableStock
                                      }
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
                                     <div className="flex items-center gap-1">
                                      <span>&#x09F3;{price.toFixed(2)}</span>
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        onPress={() => startEditingPrice(item.product._id, price)}
                                      >
                                        <Edit size={14} />
                                      </Button>
                                    </div>
                                    </div>
                                   
                                  )}
                                </TableCell>
                                <TableCell>
                                  &#x09F3;{(price * item.quantity).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="danger"
                                    className="text-2xl"
                                    onPress={() =>
                                      removeFromCart(item.product._id)
                                    }
                                  >
                                    ×
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardBody>
            </ScrollShadow>
          </Card>
        </div>
      </div>

      {/* Payment Section */}
      <div className="flex flex-col md:flex-row-reverse gap-4 mt-4 justify-between w-full">
        <div className="space-y-3 md:w-[40rem] 2xl:w-1/3 dark:bg-gray-800/25 bg-slate-600/15 p-4 rounded-xl text-xs">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>&#x09F3;{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>Tax (8%):</span>
            <span>&#x09F3;{tax.toFixed(2)}</span>
          </div>

          {/* Discount */}
          <div className="flex justify-between items-center">
            <span>Discount:</span>
            <div>
              -{" "}
              <input
                type="number"
                min="0"
                max={subtotal + tax}
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1 border rounded dark:bg-white/5 dark:text-white text-right text-xs"
              />
            </div>
          </div>
          <Divider className="my-4" />
          {/* Final total after discount */}
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>
              &#x09F3;{Math.round(subtotal + tax - discount).toFixed(2)}
            </span>
          </div>
          {/* Payment Method Selection */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setAmountPaid(total);
                setIsPartialPay(false);
              }}
              className={`px-3 py-1 rounded ${!isPartialPay ? "bg-green-600" : "bg-gray-600"}`}
            >
              Full Payment
            </button>
            <button
              onClick={() => {
                setAmountPaid("");
                setIsPartialPay(true);
              }}
              className={`px-3 py-1 rounded ${isPartialPay ? "bg-blue-600" : "bg-gray-600"}`}
            >
              Partial Payment
            </button>
          </div>

          {/* Conditional Rendering for Partial Payment */}
          {amountPaid !== total && isPartialPay && (
            <>
              {/* Amount Paid */}
              <div className="flex justify-between items-center mt-3">
                <span>Amount Paid:</span>
                <input
                  type="number"
                  min="0"
                  max={totalNum}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-24 px-2 py-1 rounded border dark:bg-white/5 dark:text-white text-right text-xs"
                />
              </div>

              {/* Due Amount */}
              <div className="flex justify-between">
                <span>Due Amount:</span>
                <span>&#x09F3;{dueAmount.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        <div className="space-y-4 md:w-[50rem] bg-slate-600/15 p-4 rounded-xl 2xl:w-2/3">
          <div className="flex gap-4 w-full">
            <Input
              size="sm"
              label="Customer Name"
              placeholder="Enter customer name"
              value={customerName}
              onValueChange={setCustomerName}
            />
            <Input
              size="sm"
              label="Mobile No."
              placeholder="016----"
              value={customerMobile}
              onValueChange={setCustomerMobile}
            />
          </div>
          <div className="flex gap-4">
            <Select
              size="md"
              label="Payment Method"
              selectedKeys={[paymentMethod]}
              onSelectionChange={(keys) =>
                setPaymentMethod(Array.from(keys)[0] as string)
              }
            >
              <SelectItem key="cash" startContent={<DollarSign size={16} />}>
                Cash
              </SelectItem>
              <SelectItem key="card" startContent={<CreditCard size={16} />}>
                Card
              </SelectItem>
              <SelectItem key="check">Check</SelectItem>
            </Select>

            {/* Cash Received (only for cash payments) */}
            {paymentMethod === "cash" && (
              <Input
                type="number"
                label="Cash Received"
                placeholder="0.00"
                value={cashReceived}
                onValueChange={setCashReceived}
                startContent="৳"
              />
            )}
          </div>

          {/* Change (only for cash payments) */}
          {paymentMethod === "cash" && cashReceived && (
            <div className="flex justify-between text-xl font-medium">
              <span>Change:</span>
              <span className={change >= 0 ? "text-green-600" : "text-red-600"}>
                &#x09F3;{Math.abs(change).toFixed(2)}
              </span>
            </div>
          )}

          <Button
            color="primary"
            size="lg"
            className="w-full"
            onPress={processSale}
            isLoading={isProcessing}
            isDisabled={
              cart.length === 0 ||
              !amountPaid ||
              amountPaidNum <= 0 ||
              (paymentMethod === "cash" && (!cashReceived || change < 0))
            }
          >
            {buttonText}
          </Button>
        </div>
      </div>

      {/* Price Modal */}
      <Modal
        isOpen={isPriceModalOpen}
        onClose={onPriceModalClose}
        size="sm"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-lg font-bold">Set Selling Price</h2>
                <p className="text-sm text-gray-600">
                  {selectedProduct?.name}
                </p>
                <p className="text-xs text-gray-500">
                  Default Price: ৳{selectedProduct?.sellingPrice.toFixed(2)}
                </p>
              </ModalHeader>
              <ModalBody>
                <Input
                  type="number"
                  label="Selling Price"
                  placeholder="Enter selling price"
                  value={customPrice}
                  onValueChange={setCustomPrice}
                  startContent="৳"
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={onPriceModalClose}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={addToCartWithPrice}
                  isDisabled={!customPrice || parseFloat(customPrice) <= 0}
                >
                  Add to Cart
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="md"
        className="print-modal"
      >
        <ModalContent className="max-w-xs mx-auto">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-center p-2">
                <h2 className="text-xl font-bold">রাইয়ান কসমেটিক্স</h2>
                <p className="text-xs">
                  Madhupur,Tangail
                </p>
                <p className="text-xs">Tel: 01728-099763</p>
                <Divider className="my-1" />
                <p className="text-sm font-medium">
                  Receipt #{receiptData?._id.toString().slice(-6)}
                </p>
                <p className="text-xs">
                  {new Date(receiptData?.createdAt).toLocaleString()}
                </p>
                <p className="text-xs">
                  Customer:{" "}
                  {receiptData?.customer?.customerName || "Walk-in Customer"}
                </p>
                {receiptData?.customer?.customerMobile && (
                  <p className="text-xs">
                    Mobile: {receiptData.customer.customerMobile}
                  </p>
                )}
              </ModalHeader>
              <ModalBody className="p-2">
                {receiptData && (
                  <div className="text-xs font-mono">
                    <Table
                      aria-label="Receipt items"
                      className="text-xs"
                      removeWrapper
                    >
                      <TableHeader>
                        <TableColumn className="text-xs p-1">Item</TableColumn>
                        <TableColumn className="text-xs p-1 text-right">
                          Qty
                        </TableColumn>
                        <TableColumn className="text-xs p-1 text-right">
                          Total
                        </TableColumn>
                      </TableHeader>
                      <TableBody>
                        {receiptData.items.map((item: any, index: number) => (
                          <TableRow
                            key={index}
                            className="border-b border-dashed border-gray-300"
                          >
                            <TableCell className="p-1">
                              <div className="flex flex-col">
                                <span className="truncate max-w-[196px]">
                                  {item.product.name}
                                </span>
                                <div className="text-[8px] flex gap-6">
                                  <span>{item.product.sku}</span>
                                  <span>৳{item.price.toFixed(2)}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="p-1 text-right">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="p-1 text-right">
                              ৳{item.total.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <Divider className="my-2" />

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>৳{receiptData.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (8%):</span>
                        <span>৳{receiptData.tax.toFixed(2)}</span>
                      </div>
                      {receiptData.discount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Discount:</span>
                          <span>-৳{receiptData.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold border-t border-dashed border-gray-300 pt-1">
                        <span>Total:</span>
                        <span>৳{receiptData.total.toFixed(2)}</span>
                      </div>

                      {/* Payment Details */}
                      <div className="border-t border-dashed border-gray-300 pt-1 mt-2">
                        <div className="flex justify-between font-medium">
                          <span>Payment Method:</span>
                          <span className="capitalize">
                            {receiptData.paymentMethod}
                          </span>
                        </div>

                        {/* Amount Paid */}
                        <div className="flex justify-between">
                          <span>Amount Paid:</span>
                          <span>৳{receiptData.amountPaid.toFixed(2)}</span>
                        </div>

                        {/* Due Amount (if partial payment) */}
                        {receiptData.amountPaid < receiptData.total && (
                          <div className="flex justify-between text-red-600 font-medium">
                            <span>Due Amount:</span>
                            <span>
                              ৳
                              {(
                                receiptData.total - receiptData.amountPaid
                              ).toFixed(2)}
                            </span>
                          </div>
                        )}

                        {/* Cash Payment Details */}
                        {receiptData.paymentMethod === "cash" && (
                          <>
                            <div className="flex justify-between">
                              <span>Cash Received:</span>
                              <span>
                                ৳{parseFloat(cashReceived).toFixed(2)}
                              </span>
                            </div>
                            {parseFloat(cashReceived) >
                              receiptData.amountPaid && (
                              <div className="flex justify-between font-medium">
                                <span>Change:</span>
                                <span>
                                  ৳
                                  {(
                                    parseFloat(cashReceived) -
                                    receiptData.amountPaid
                                  ).toFixed(2)}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <Divider className="my-2" />

                    <div className="text-center pt-2">
                      <p className="text-xs">Thank you for your business!</p>
                      <p className="text-xs">Have a great day!</p>
                      <p className="text-xs mt-2">
                        {new Date().toLocaleDateString()}
                      </p>

                      {/* Payment Status Badge */}
                      <div className="mt-2">
                        {receiptData.amountPaid >= receiptData.total ? (
                          <Badge color="success" className="text-xs">
                            PAID IN FULL
                          </Badge>
                        ) : (
                          <Badge color="warning" className="text-xs">
                            PARTIAL PAYMENT
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="p-2 justify-center">
                <Button
                  color="primary"
                  variant="light"
                  size="sm"
                  onPress={() => {
                    onClose();
                    setCashReceived("");
                    setDiscount(0);
                  }}
                >
                  Close
                </Button>

                <Button
                  color="primary"
                  onPress={() => {
                    printReceipt();
                    setCashReceived("");
                    setDiscount(0);
                  }}
                  size="sm"
                  startContent={<Printer size={14} />}
                >
                  Print
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <style
  dangerouslySetInnerHTML={{
    __html: `
      @media print {
        body * {
          visibility: hidden;
          color: black;
        }
        .print-modal,
        .print-modal * {
          visibility: visible;
        }
        .print-modal {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .print-modal .modal-content {
          box-shadow: none !important;
          border: none !important;
          width: 80mm !important;
          margin: 0 auto !important;
        }
        .print-modal .modal-footer {
          display: none !important;
        }
      }
    `,
  }}
/>

    </div>
  );
}