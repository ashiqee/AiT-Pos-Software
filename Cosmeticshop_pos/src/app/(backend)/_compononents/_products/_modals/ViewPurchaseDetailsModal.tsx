'use client';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Divider } from '@heroui/divider';
import { Badge } from '@heroui/badge';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Eye, Package, DollarSign, User, Calendar, Hash } from 'lucide-react';

interface PurchaseBatch {
  purchaseDate: string;
  quantity: number;
  unitCost: number;
  supplier: string;
  batchNumber: string;
}

interface Purchase {
  _id: string;
  product: {
    _id: string;
    name: string;
    sku: string;
    category: { name: string };
  };
  batches: PurchaseBatch[];
  totalQuantity: number;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
}

interface ViewPurchaseDetailsModalProps {
  purchase: Purchase;
}

export default function ViewPurchaseDetailsModal({ purchase }: ViewPurchaseDetailsModalProps) {
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
      day: 'numeric'
    });
  };

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
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-lg p-2">
                    <Package size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Purchase Details</h2>
                    <p className="text-sm text-gray-500">
                      ID: #{purchase._id.toString().slice(-6)}
                    </p>
                  </div>
                </div>
              </ModalHeader>
              
              <ModalBody>
                <div className="space-y-6">
                  {/* Product Information */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Product Information</h3>
                    </CardHeader>
                    <CardBody>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Package size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">Product Name:</span>
                            <span className="font-medium">{purchase.product.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Hash size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">SKU:</span>
                            <span className="font-medium">{purchase.product.sku}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Package size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">Category:</span>
                            <span className="font-medium">{purchase.product.category.name}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">Purchase Date:</span>
                            <span className="font-medium">{formatDate(purchase.createdAt)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Package size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">Total Quantity:</span>
                            <span className="font-medium">{purchase.totalQuantity}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <DollarSign size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">Total Cost:</span>
                            <span className="font-bold text-lg">{formatCurrency(purchase.totalCost)}</span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                  
                  {/* Purchase Batches */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Purchase Batches</h3>
                    </CardHeader>
                    <CardBody>
                      <Table aria-label="Purchase batches" removeWrapper>
                        <TableHeader>
                          <TableColumn>BATCH #</TableColumn>
                          <TableColumn>PURCHASE DATE</TableColumn>
                          <TableColumn>SUPPLIER</TableColumn>
                          <TableColumn className="text-right">QTY</TableColumn>
                          <TableColumn className="text-right">Location</TableColumn>
                          <TableColumn className="text-right">UNIT COST</TableColumn>
                          <TableColumn className="text-right">TOTAL</TableColumn>
                        </TableHeader>
                        <TableBody>
                          {purchase.batches.map((batch, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {batch.batchNumber && (
                                    <Badge variant="flat" size="sm">
                                      {batch.batchNumber}
                                    </Badge>
                                  )}
                                  <span>Batch #{index + 1}</span>
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(batch.purchaseDate)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User size={14} className="text-gray-500" />
                                  <span>{batch.supplier || 'N/A'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{batch.quantity}</TableCell>
                              <TableCell className="text-right">{batch.quantity}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(batch.unitCost)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(batch.quantity * batch.unitCost)}
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