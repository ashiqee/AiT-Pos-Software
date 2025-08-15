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
} from "lucide-react";
import Image from "next/image";
import ProfileBar from "@/components/shared/ProfileBar";

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
}

export default function POSPage() {
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [receiptData, setReceiptData] = useState<any>(null);
  const [discount, setDiscount] = useState(0);

  // Fetch products
  const fetchProducts = async (search = "") => {
    try {
      const response = await fetch(`/api/products?search=${search}`);
      const data = await response.json();
      setProducts(data);

      console.log(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  useEffect(() => {
    fetchProducts(); // initial load
  }, []);

  // Trigger search with debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Add product to cart
  const addToCart = (product: CartProduct) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product._id === product._id
      );

      if (existingItem) {
        return prevCart.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
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

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );
  const tax = subtotal * 0.08;
  const total = subtotal + tax - discount;
  const change = cashReceived ? parseFloat(cashReceived) - total : 0;

  // Process sale
  const processSale = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);

    try {
      const saleData = {
        items: cart.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.sellingPrice,
          total: item.product.sellingPrice * item.quantity,
        })),
        subtotal,
        discount,
        tax,
        total,
        paymentMethod,
        customer: customerName || "Walk-in Customer",
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
        setCashReceived("");
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

  return (
    <div className="flex  flex-col ">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          <p className="text-gray-600">Process sales and manage transactions</p>
        </div>
        <div className="w-full md:w-80">
          <Input
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            size="lg"
          />
        </div>
        <div className="absolute md:relative top-6 md:top-0 right-8">
          <ProfileBar />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-grow">
        {/* Products Section */}
        <div className="lg:w-2/3">
          <Card className="h-[60vh] overflow-y-auto">
            <CardHeader>
              <h2 className="text-lg font-semibold">Products</h2>
            </CardHeader>
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
                    onPress={() => {
                      if (product?.availableStock > 0) {
                        addToCart(product);
                      }
                    }}
                  >
                    <CardBody className="p-4 text-center">
                      <div className="mb-2">
                        <div className=" rounded-lg flex items-center justify-center">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              width={500}
                              height={500}
                              className=" object-cover h-28 rounded-xl w-full "
                            />
                          ) : (
                            <span className="text-gray-500">Product Image</span>
                          )}
                        </div>
                      </div>
                      <h3 className="font-medium text-xs truncate">
                        {product?.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {product?.category?.name}
                      </p>
                      <p className="font-bold text-lg mt-1">
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
          </Card>
        </div>

        {/* Cart Section */}
        <div className="lg:w-1/3 overflow-y-auto">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart size={20} />
                Shopping Cart ({totalItems})
              </h2>
            </CardHeader>
            <CardBody className="flex-grow flex overflow-y-auto max-h-[52vh] flex-col">
              {cart.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-gray-500">
                  Your cart is empty
                </div>
              ) : (
                <>
                  <div className="flex-grow  mb-4">
                    <Table aria-label="Cart items">
                      <TableHeader>
                        <TableColumn>Item</TableColumn>
                        <TableColumn>Qty</TableColumn>
                        <TableColumn>Price</TableColumn>
                        <TableColumn>Total</TableColumn>
                        <TableColumn> a</TableColumn>
                      </TableHeader>
                      <TableBody className="  ">
                        {cart.map((item, i) => (
                          <TableRow key={item.product._id}>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">
                                  <span className="text-sm">{i + 1}.</span>{" "}
                                  {item.product.name}
                                </div>
                                <div className="text-sm text-gray-500">
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
                                <span className="w-8 text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  isDisabled={
                                    item.quantity >= item.product.availableStock
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
                            </TableCell>
                            <TableCell>
                              ${item.product.sellingPrice.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              $
                              {(
                                item.product.sellingPrice * item.quantity
                              ).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => removeFromCart(item.product._id)}
                              >
                                ×
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <Divider className="my-4" />
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
      <div className="flex flex-col md:flex-row-reverse gap-4 md:gap-10 mt-6 justify-between w-full">
        <div className="space-y-3 lg:w-1/3 dark:bg-gray-800/25 rounded-2xl bg-black/25 p-5 text-xs">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>Tax (8%):</span>
            <span>${tax.toFixed(2)}</span>
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
                className="w-24 px-2 py-1 rounded bg-white/5 text-white text-right text-xs"
              />
            </div>
          </div>
          <Divider className="my-4" />
          {/* Final total after discount */}
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>${(subtotal + tax - discount).toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-4 lg:w-2/3">
          <div className="flex gap-4 w-full">
            <Input
              size="sm"
              label="Customer Name"
              placeholder="Enter customer name"
              value={customerName}
              onValueChange={setCustomerName}
            />
            <Select
              size="sm"
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
          </div>

          {paymentMethod === "cash" && (
            <Input
              type="number"
              label="Cash Received"
              placeholder="0.00"
              value={cashReceived}
              onValueChange={setCashReceived}
              startContent={<DollarSign size={16} />}
            />
          )}

          {paymentMethod === "cash" && cashReceived && (
            <div className="flex justify-between text-xl font-medium">
              <span>Change:</span>
              <span className={change >= 0 ? "text-green-600" : "text-red-600"}>
                ${Math.abs(change).toFixed(2)}
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
              (paymentMethod === "cash" && (!cashReceived || change < 0))
            }
          >
            Process Sale
          </Button>
        </div>
      </div>

      {/* Receipt Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Sale Receipt
              </ModalHeader>
              <ModalBody>
                {receiptData && (
                  <div className="p-4 bg-white text-black rounded-lg border border-gray-200">
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-bold">POS SYSTEM</h2>
                      <p className="text-gray-600">
                        123 Main St, City, Country
                      </p>
                      <p className="text-gray-600">Tel: (123) 456-7890</p>
                      <Divider className="my-2" />
                      <p>Receipt #{receiptData._id.toString().slice(-6)}</p>
                      <p>{new Date(receiptData.createdAt).toLocaleString()}</p>
                      <p>Customer: {receiptData.customer}</p>
                    </div>

                    <Table aria-label="Receipt items">
                      <TableHeader>
                        <TableColumn>Item</TableColumn>
                        <TableColumn>Qty</TableColumn>
                        <TableColumn>Price</TableColumn>
                        <TableColumn>Total</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {receiptData.items.map((item: any, index: number) => (
                          <TableRow className="text-white" key={index}>
                            <TableCell>{item.product.name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.price.toFixed(2)}</TableCell>
                            <TableCell>${item.total.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <Divider className="my-4" />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${receiptData.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (8%):</span>
                        <span>${receiptData.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-${receiptData?.discount?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>${receiptData.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Method:</span>
                        <span className="capitalize">
                          {receiptData.paymentMethod}
                        </span>
                      </div>
                      {paymentMethod === "cash" && (
                        <>
                          <div className="flex justify-between">
                            <span>Cash Received:</span>
                            <span>${cashReceived}</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span>Change:</span>
                            <span>${change.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-6 text-center text-gray-500">
                      <p>Thank you for your business!</p>
                      <p>Have a great day!</p>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="primary" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  onPress={printReceipt}
                  startContent={<Printer size={16} />}
                >
                  Print Receipt
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
