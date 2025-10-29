"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Badge } from "@heroui/badge";
import { Users, Phone, Package, DollarSign, Calendar, Eye } from "lucide-react";
import Image from "next/image";

interface CustomerPurchase {
  _id: string;
  items: Array<{
    product: {
      _id: string;
      name: string;
      sku: string;
      imageUrl: string;
    };
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  dueAmount: number;
  paymentStatus: string;
  createdAt: string;
  user: {
    name: string;
  };
}

interface Customer {
  customerName: string;
  customerMobile: string;
  totalDue: number;
  totalPurchases: number;
  totalSpent: number;
  lastPurchase: string;
  purchases: CustomerPurchase[];
}

interface CustomerDetailModalProps {
  customer: Customer | null;
}

export default function CustomerDetailModal({
  customer,
}: CustomerDetailModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!customer) {
    return null;
  }

  return (
    <>
      <Button isIconOnly size="sm" variant="light" onPress={onOpen}>
        <Eye size={16} />
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="5xl"
        scrollBehavior="outside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <Users size={24} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{customer.customerName}</h2>
                <p className="text-sm text-gray-500">
                  {customer.customerMobile && (
                    <span className="flex items-center gap-1">
                      <Phone size={14} />
                      {customer.customerMobile}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </ModalHeader>

          <ModalBody className="space-y-6">
            {/* Customer Summary */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Customer Summary</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Purchases</p>
                    <p className="text-lg font-bold">
                      {customer.totalPurchases}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Spent</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(customer.totalSpent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount Due</p>
                    <p
                      className={`text-lg font-bold ${customer.totalDue > 0 ? "text-red-600" : "text-green-600"}`}
                    >
                      {formatCurrency(customer.totalDue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Purchase</p>
                    <p className="text-lg font-bold">
                      {formatDate(customer.lastPurchase)}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Purchase History */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Purchase History</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                {customer.purchases.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No purchase history found
                  </div>
                ) : (
                  customer.purchases.map((purchase) => (
                    <Card key={purchase._id} className="border border-gray-200">
                      <CardBody className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium">
                              Receipt #{purchase._id.toString().slice(-6)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(purchase.createdAt)}
                            </p>
                          </div>
                          <Badge
                            color={
                              purchase.paymentStatus === "Paid"
                                ? "success"
                                : "warning"
                            }
                            variant="flat"
                          >
                            {purchase.paymentStatus}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal:</span>
                            <span>{formatCurrency(purchase.subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Tax:</span>
                            <span>{formatCurrency(purchase.tax)}</span>
                          </div>
                          {purchase.discount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Discount:</span>
                              <span className="text-red-600">
                                -{formatCurrency(purchase.discount)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between font-medium">
                            <span>Total:</span>
                            <span>{formatCurrency(purchase.total)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Amount Paid:</span>
                            <span>{formatCurrency(purchase.amountPaid)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-medium">
                            <span
                              className={
                                purchase.dueAmount > 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }
                            >
                              Due Amount:
                            </span>
                            <span
                              className={
                                purchase.dueAmount > 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }
                            >
                              {formatCurrency(purchase.dueAmount)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Items:</p>
                          <div className="space-y-2">
                            {purchase.items.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-3 text-sm"
                              >
                                <div className="bg-gray-200 rounded-lg w-10 h-10 flex items-center justify-center">
                                  {item.product.imageUrl ? (
                                    <Image
                                      src={item.product.imageUrl}
                                      alt={item.product.name}
                                      width={40}
                                      height={40}
                                      className="w-10 h-10 rounded-md object-cover"
                                    />
                                  ) : (
                                    <Package
                                      size={16}
                                      className="text-gray-500"
                                    />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {item.product.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {item.product.sku}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div>
                                    {item.quantity} ×{" "}
                                    {formatCurrency(item.price)}
                                  </div>
                                  <div className="font-medium">
                                    {formatCurrency(item.total)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                )}
              </CardBody>
            </Card>

            {/* Additional Customer Info */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">
                  Additional Information
                </h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Customer Status
                    </p>
                    <Badge
                      color={customer.totalDue > 0 ? "warning" : "success"}
                      variant="flat"
                    >
                      {customer.totalDue > 0
                        ? "Has Outstanding Balance"
                        : "Account in Good Standing"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Average Purchase Value
                    </p>
                    <p className="font-medium">
                      {formatCurrency(
                        customer.totalPurchases > 0
                          ? customer.totalSpent / customer.totalPurchases
                          : 0
                      )}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </ModalBody>

          <ModalFooter>
            <Button color="primary" onPress={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
