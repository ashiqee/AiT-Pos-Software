'use client';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Divider } from '@heroui/divider';
import { Badge } from '@heroui/badge';
import { Eye, Package, DollarSign, Calendar, User, Hash, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import ProductImage from '../../_dashboard/_ui/ProductImage';

interface Batch {
  purchaseDate: string;
  quantity: number;
  unitCost: number;
  supplier: string;
  batchNumber: string;
}

interface Product {
  warehouseStock: number;
  shopStock: number;
  _id: string;
  name: string;
  description: string;
  sellingPrice: number;
  batches: Batch[];
  totalQuantity: number;
  totalSold: number;
  availableStock: number;
  inStock: boolean;
  stockLevel: string;
  category: { name: string };
  sku: string;
  barcode: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface ViewProductDetailsModalProps {
  product: Product;
}

export default function ViewProductDetailsModal({ product }: ViewProductDetailsModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate total inventory value
  const totalInventoryValue = product.batches.reduce(
    (sum, batch) => sum + (batch.quantity * batch.unitCost),
    0
  );

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
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-200 rounded-lg w-12 h-12 flex items-center justify-center">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-md object-cover"
                      />
                    ) : (
                      <ImageIcon size={24} className="text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{product.name}</h2>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                </div>
              </ModalHeader>
              
              <ModalBody>
                <div className="space-y-6">
                  {/* Product Overview */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Product Overview</h3>
                    </CardHeader>
                    <CardBody>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Hash size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">SKU:</span>
                            <span className="font-medium">{product.sku}</span>
                          </div>
                          
                          {product.barcode && (
                            <div className="flex items-center gap-2">
                              <Hash size={16} className="text-gray-500" />
                              <span className="text-sm text-gray-500">Barcode:</span>
                              <span className="font-medium">{product.barcode}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Package size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">Category:</span>
                            <span className="font-medium">{product.category.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <DollarSign size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">Selling Price:</span>
                            <span className="font-medium">${product.sellingPrice.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Package size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">Stock Status:</span>
                            <Badge 
                              color={
                                product.stockLevel === 'high' ? 'success' : 
                                product.stockLevel === 'low' ? 'warning' : 'danger'
                              }
                              variant="flat"
                            >
                              {product.stockLevel === 'high' ? 'In Stock' : 
                               product.stockLevel === 'low' ? 'Low Stock' : 'Out of Stock'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Package size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">Available Stock:</span>
                            <span className="font-medium">shop:{product.shopStock}</span>
                            <span className="font-medium">warehouse:{product.warehouseStock}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Package size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">Total Quantity:</span>
                            <span className="font-medium">{product.totalQuantity}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Package size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">Total Sold:</span>
                            <span className="font-medium">{product.totalSold}</span>
                          </div>
                        </div>


<ProductImage
  imageUrl={product.imageUrl}
  alt={product.name}
  title={product.name}
/>
                      </div>
                      
                      {product.description && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-500 mb-1">Description:</p>
                          <p className="text-sm">{product.description}</p>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                  
                  {/* Inventory Batches */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Inventory Batches</h3>
                    </CardHeader>
                    <CardBody>
                      {product.batches.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No inventory batches found</p>
                      ) : (
                        <div className="space-y-4">
                          {product.batches.map((batch, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-3">
                                <h4 className="font-medium">Batch #{index + 1}</h4>
                                {batch.batchNumber && (
                                  <Badge variant="flat" size="sm">
                                    {batch.batchNumber}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-500">Purchase Date</p>
                                  <p className="font-medium">{formatDate(batch.purchaseDate)}</p>
                                </div>
                                
                                <div>
                                  <p className="text-gray-500">Quantity</p>
                                  <p className="font-medium">{batch.quantity}</p>
                                </div>
                                
                                <div>
                                  <p className="text-gray-500">Unit Cost</p>
                                  <p className="font-medium">${batch.unitCost.toFixed(2)}</p>
                                </div>
                                
                                <div>
                                  <p className="text-gray-500">Total Value</p>
                                  <p className="font-medium">
                                    ${(batch.quantity * batch.unitCost).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              
                              {batch.supplier && (
                                <div className="mt-3 flex items-center gap-2">
                                  <User size={14} className="text-gray-500" />
                                  <span className="text-sm text-gray-500">Supplier:</span>
                                  <span className="text-sm font-medium">{batch.supplier}</span>
                                </div>
                              )}
                            </div>
                          ))}
                          
                          <Divider className="my-4" />
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Total Inventory Value:</span>
                            <span className="text-lg font-bold">
                              ${totalInventoryValue.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                  
                  {/* Additional Information */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Additional Information</h3>
                    </CardHeader>
                    <CardBody>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-500" />
                          <span className="text-gray-500">Created:</span>
                          <span>{formatDate(product.createdAt)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-500" />
                          <span className="text-gray-500">Last Updated:</span>
                          <span>{formatDate(product.updatedAt)}</span>
                        </div>
                      </div>
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