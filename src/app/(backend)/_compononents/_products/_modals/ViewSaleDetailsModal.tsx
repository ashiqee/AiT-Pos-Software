'use client';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Divider } from '@heroui/divider';
import { Badge } from '@heroui/badge';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Eye, Package, DollarSign, User, Calendar, CreditCard, Receipt } from 'lucide-react';
import Image from 'next/image';

interface SaleItem {
  product: {
    _id: string;
    name: string;
    imageUrl: string;
    sku: string;
  };
  quantity: number;
  price: number;
  total: number;
}

interface Sale {
  _id: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  customer: {
    customerName: string;
    customerMobile: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ViewSaleDetailsModalProps {
  sale: Sale;
}

export default function ViewSaleDetailsModal({ sale }: ViewSaleDetailsModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const dueAmount = sale.total - sale.amountPaid;

  return (
    <>
      <Button 
        isIconOnly 
        size="sm" 
        variant="light"
        onPress={onOpen}
      >
        <Eye size={16} />
      </Button>
      
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-lg p-2">
                    <Receipt size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Sale Details</h2>
                    <p className="text-sm text-gray-500">
                      Receipt #{sale._id.toString().slice(-6)}
                    </p>
                  </div>
                </div>
              </ModalHeader>
              
              <ModalBody>
                <div className="space-y-6">
                  {/* Sale Overview */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Sale Overview</h3>
                    </CardHeader>
                    <CardBody>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">Customer:</span>
                            <span className="font-medium">{sale?.customer?.customerName}</span>
                          </div>
                          
                          {sale?.customer?.customerMobile && (
                            <div className="flex items-center gap-2">
                              <User size={16} className="text-gray-500" />
                              <span className="text-sm text-gray-500">Mobile:</span>
                              <span className="font-medium">{sale?.customer?.customerMobile}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">Date:</span>
                            <span className="font-medium">{formatDate(sale.createdAt)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <CreditCard size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">Payment Method:</span>
                            <Badge 
                              color={
                                sale.paymentMethod === 'cash' ? 'success' : 
                                sale.paymentMethod === 'card' ? 'primary' : 'warning'
                              }
                              variant="flat"
                              className="capitalize"
                            >
                              {sale.paymentMethod}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500" >&#2547;</span>
                            <span className="text-sm text-gray-500">Subtotal:</span>
                            <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                           <span className="text-gray-500" >&#2547;</span>
                            <span className="text-sm text-gray-500">Tax:</span>
                            <span className="font-medium">{formatCurrency(sale.tax)}</span>
                          </div>
                          
                          {sale.discount > 0 && (
                            <div className="flex items-center gap-2">
                             <span className="text-gray-500" >&#2547;</span>
                              <span className="text-sm text-gray-500">Discount:</span>
                              <span className="font-medium text-red-600">
                                -{formatCurrency(sale.discount)}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500" >&#2547;</span>
                            <span className="text-sm text-gray-500">Total:</span>
                            <span className="font-bold text-lg">{formatCurrency(sale.total)}</span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                  
                  {/* Payment Details */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Payment Details</h3>
                    </CardHeader>
                    <CardBody>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Amount Paid:</span>
                          <span className="font-medium">{formatCurrency(sale.amountPaid)}</span>
                        </div>
                        
                        {dueAmount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Due Amount:</span>
                            <span className="font-medium text-red-600">
                              {formatCurrency(dueAmount)}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Payment Status:</span>
                          <Badge 
                            color={dueAmount > 0 ? 'warning' : 'success'}
                            variant="flat"
                          >
                            {dueAmount > 0 ? 'Partial Payment' : 'Paid in Full'}
                          </Badge>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                  
                  {/* Sale Items */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Sale Items</h3>
                    </CardHeader>
                    <CardBody>
                      <Table aria-label="Sale items" removeWrapper>
                        <TableHeader>
                          <TableColumn>ITEM</TableColumn>
                          <TableColumn className="text-right">QTY</TableColumn>
                          <TableColumn className="text-right">PRICE</TableColumn>
                          <TableColumn className="text-right">TOTAL</TableColumn>
                        </TableHeader>
                        <TableBody>
                          {sale.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div className="flex items-center gap-3">
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
                                      <Package size={16} className="text-gray-500" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-medium">{item.product.name}</div>
                                    <div className="text-xs text-gray-500">
                                      SKU: {item.product.sku}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(item.price)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.total)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardBody>
                  </Card>
                </div>
              </ModalBody>
              
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}