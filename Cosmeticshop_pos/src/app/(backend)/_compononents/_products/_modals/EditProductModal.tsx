'use client';

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Divider } from '@heroui/divider';
import { Plus, Trash2, Save, Edit } from 'lucide-react';
import { addToast } from '@heroui/react';
import { toast } from 'sonner';


interface Batch {
  purchaseDate: string;
  quantity: number;
  unitCost: number;
  supplier: string;
  batchNumber: string;
}

interface Category {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  totalSold: number;
  sellingPrice: number;
  cost: number;
  totalQuantity: number;
  availableStock: number;
  category: Category;
  batches: Batch[];
  sku: string;
  barcode: string;
  imageUrl: string;
  inStock: boolean;
  stockLevel: "high" | "low" | "out";
}

interface EditProductModalProps {
  product: Product;
  onProductUpdated: () => void;
}

export default function EditProductModal({ product, onProductUpdated }: EditProductModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Product form state
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    sellingPrice: '',
    category: '',
    sku: '',
    barcode: '',
    imageUrl: ''
  });
  
  // Batches state
  const [batches, setBatches] = useState<Batch[]>([]);

  // Initialize form when product changes
  useEffect(() => {
    if (product) {
      setProductData({
        name: product.name,
        description: product.description || '',
        sellingPrice: product.sellingPrice.toString(),
        category: product.category._id,
        sku: product.sku || '',
        barcode: product.barcode || '',
        imageUrl: product.imageUrl || ''
      });
      
      setBatches(product.batches.map(batch => ({
        purchaseDate: new Date(batch.purchaseDate).toISOString().split('T')[0],
        quantity: batch.quantity,
        unitCost: batch.unitCost,
        supplier: batch.supplier || '',
        batchNumber: batch.batchNumber || ''
      })));
    }
  }, [product]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        addToast({
              title: "Categories",
              description: 'Failed to load categories',
              color: "warning",
            })
        
      }
    };
    
    fetchCategories();
  }, []);

  // Handle product form changes
  const handleProductChange = (field: string, value: string) => {
    setProductData(prev => ({ ...prev, [field]: value }));
  };

  // Handle batch changes
  const handleBatchChange = (index: number, field: keyof Batch, value: string | number) => {
    const newBatches = [...batches];
    newBatches[index] = { ...newBatches[index], [field]: value };
    setBatches(newBatches);
  };

  // Add a new batch
  const addBatch = () => {
    setBatches([
      ...batches,
      {
        purchaseDate: new Date().toISOString().split('T')[0],
        quantity: 0,
        unitCost: 0,
        supplier: '',
        batchNumber: ''
      }
    ]);
  };

  // Remove a batch
  const removeBatch = (index: number) => {
    if (batches.length > 1) {
      const newBatches = [...batches];
      newBatches.splice(index, 1);
      setBatches(newBatches);
    }
  };

  // Validate form
  const validateForm = () => {
    if (!productData.name.trim()) {
      toast.error('Product name is required');
      return false;
    }
    
    if (!productData.sellingPrice || parseFloat(productData.sellingPrice) <= 0) {
      toast.error('Valid selling price is required');
      return false;
    }
    
    if (!productData.category) {
      toast.error('Category is required');
      return false;
    }
    
    if (batches.some(batch => batch.quantity <= 0 || batch.unitCost <= 0)) {
      toast.error('All batches must have valid quantity and unit cost');
      return false;
    }
    
    return true;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Prepare data for API
      const payload = {
        ...productData,
        sellingPrice: parseFloat(productData.sellingPrice),
        batches: batches.map(batch => ({
          ...batch,
          quantity: parseInt(batch.quantity as any),
          unitCost: parseFloat(batch.unitCost as any),
          purchaseDate: new Date(batch.purchaseDate)
        }))
      };
      
      const response = await fetch(`/api/products/${product._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update product');
      }
      
      const updatedProduct = await response.json();
      toast.success('Product updated successfully');
      
      // Notify parent component
      onProductUpdated();
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        isIconOnly 
        size="sm" 
        variant="light"
        onPress={onOpen}
      >
        <Edit size={16} />
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
                Edit Product
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  {/* Product Information */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Product Information</h3>
                    </CardHeader>
                    <CardBody className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Product Name"
                          placeholder="Enter product name"
                          value={productData.name}
                          onValueChange={(value) => handleProductChange('name', value)}
                          isRequired
                        />
                        
                        <Input
                          label="SKU"
                          placeholder="Enter SKU"
                          value={productData.sku}
                          onValueChange={(value) => handleProductChange('sku', value)}
                        />
                        
                        <Input
                          type="number"
                          label="Selling Price"
                          placeholder="0.00"
                          value={productData.sellingPrice}
                          onValueChange={(value) => handleProductChange('sellingPrice', value)}
                          isRequired
                          startContent="$"
                        />
                        
                        <Select
                          label="Category"
                          placeholder="Select a category"
                          selectedKeys={productData.category ? [productData.category] : []}
                          onSelectionChange={(keys) => handleProductChange('category', Array.from(keys)[0] as string)}
                          isRequired
                        >
                          {categories.map((category) => (
                            <SelectItem key={category._id} textValue={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </Select>
                        
                        <Input
                          label="Barcode"
                          placeholder="Enter barcode"
                          value={productData.barcode}
                          onValueChange={(value) => handleProductChange('barcode', value)}
                        />
                        
                        <Input
                          label="Image URL"
                          placeholder="Enter image URL"
                          value={productData.imageUrl}
                          onValueChange={(value) => handleProductChange('imageUrl', value)}
                        />
                      </div>
                      
                      <Input
                        label="Description"
                        placeholder="Enter product description"
                        value={productData.description}
                        onValueChange={(value) => handleProductChange('description', value)}
                      />
                    </CardBody>
                  </Card>
                  
                  {/* Batches */}
                  <Card>
                    <CardHeader className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Inventory Batches</h3>
                      <Button 
                        size="sm" 
                        color="primary" 
                        variant="flat"
                        startContent={<Plus size={16} />}
                        onPress={addBatch}
                      >
                        Add Batch
                      </Button>
                    </CardHeader>
                    <CardBody className="space-y-4">
                      {batches.map((batch, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium">Batch #{index + 1}</h4>
                            {batches.length > 1 && (
                              <Button 
                                isIconOnly 
                                size="sm" 
                                color="danger" 
                                variant="light"
                                onPress={() => removeBatch(index)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              type="date"
                              label="Purchase Date"
                              value={batch.purchaseDate}
                              onValueChange={(value) => handleBatchChange(index, 'purchaseDate', value)}
                            />
                            
                            <Input
                              type="number"
                              label="Quantity"
                              placeholder="0"
                              value={batch.quantity.toString()}
                              onValueChange={(value) => handleBatchChange(index, 'quantity', parseInt(value) || 0)}
                              isRequired
                            />
                            
                            <Input
                              type="number"
                              label="Unit Cost"
                              placeholder="0.00"
                              value={batch.unitCost.toString()}
                              onValueChange={(value) => handleBatchChange(index, 'unitCost', parseFloat(value) || 0)}
                              isRequired
                              startContent="$"
                            />
                            
                            <Input
                              label="Supplier"
                              placeholder="Enter supplier name"
                              value={batch.supplier}
                              onValueChange={(value) => handleBatchChange(index, 'supplier', value)}
                            />
                            
                            <Input
                              label="Batch Number"
                              placeholder="Enter batch number"
                              value={batch.batchNumber}
                              onValueChange={(value) => handleBatchChange(index, 'batchNumber', value)}
                            />
                          </div>
                        </div>
                      ))}
                    </CardBody>
                  </Card>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="primary" 
                  variant="light" 
                  onPress={onClose}
                >
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleSubmit}
                  isLoading={isLoading}
                  startContent={<Save size={16} />}
                >
                  Update Product
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}