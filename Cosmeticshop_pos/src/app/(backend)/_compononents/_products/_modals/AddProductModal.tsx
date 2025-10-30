'use client';

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Input, Textarea } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Divider } from '@heroui/divider';
import { Plus, Trash2, Save, Package } from 'lucide-react';
import { toast } from 'sonner';
import ImageUploader from '../_uploader/ImageUploader';
import { useForm, Controller } from 'react-hook-form';

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

interface AddProductModalProps {
  onProductAdded?: () => void;
}

export default function AddProductModal({ onProductAdded }: AddProductModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize form with react-hook-form
  const { control, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      sellingPrice: '',
      category: '',
      sku: '',
      barcode: '',
      imageUrl: '',
      stockLocation: 'warehouse' // Default to warehouse for initial stock
    }
  });
  
  // Batches state
  const [batches, setBatches] = useState<Batch[]>([
    {
      purchaseDate: new Date().toISOString().split('T')[0],
      quantity: 0,
      unitCost: 0,
      supplier: '',
      batchNumber: ''
    }
  ]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        toast.error('Failed to load categories');
      }
    };
    
    fetchCategories();
  }, []);

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

  // Submit form
  const onSubmit = async (data: any) => {
    // Validate batches
    if (batches.some(batch => batch.quantity <= 0 || batch.unitCost <= 0)) {
      toast.error('All batches must have valid quantity and unit cost');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Calculate total quantity from batches
      const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
      
      // Prepare data for API
      const payload = {
        name: data.name,
        description: data.description || '',
        sellingPrice: parseFloat(data.sellingPrice),
        category: data.category,
        sku: data.sku || undefined, // Let backend auto-generate if empty
        barcode: data.barcode || undefined,
        imageUrl: data.imageUrl || undefined,
        batches: batches.map(batch => ({
          purchaseDate: new Date(batch.purchaseDate),
          quantity: parseInt(batch.quantity as any),
          unitCost: parseFloat(batch.unitCost as any),
          supplier: batch.supplier || undefined,
          batchNumber: batch.batchNumber || `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })),
        // Set initial stock based on selected location
        warehouseStock: data.stockLocation === 'warehouse' ? totalQuantity : 0,
        shopStock: data.stockLocation === 'shop' ? totalQuantity : 0
      };
      
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create product');
      }
      
      const newProduct = await response.json();
      toast.success('Product created successfully');
      
      // Reset form
      reset({
        name: '',
        description: '',
        sellingPrice: '',
        category: '',
        sku: '',
        barcode: '',
        imageUrl: '',
        stockLocation: 'warehouse'
      });
      
      setBatches([{
        purchaseDate: new Date().toISOString().split('T')[0],
        quantity: 0,
        unitCost: 0,
        supplier: '',
        batchNumber: ''
      }]);
      
      // Notify parent component
      onProductAdded?.();
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleFormSubmit = () => {
    handleSubmit(onSubmit)();
  };

  return (
    <>
      <Button 
        color="primary" 
        startContent={<Plus size={16} />}
        onPress={onOpen}
      >
        Add Product
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
                <div className="flex items-center gap-2">
                  <Package size={20} />
                  Add New Product
                </div>
              </ModalHeader>
              <ModalBody>
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="space-y-4">
                    {/* Product Information */}
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold">Product Information</h3>
                      </CardHeader>
                      <CardBody className="space-y-4">
                        {/* Image Upload Section */}
                        <div className="pt-2">
                          <ImageUploader
                            name="imageUrl"
                            label="Product Image"
                            control={control}
                            setValue={setValue}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Controller
                            name="name"
                            control={control}
                            rules={{ required: 'Product name is required' }}
                            render={({ field }) => (
                              <Input
                                label="Product Name"
                                placeholder="Enter product name"
                                value={field.value}
                                onValueChange={field.onChange}
                                isRequired
                                isInvalid={!!errors.name}
                                errorMessage={errors.name?.message}
                              />
                            )}
                          />
                          
                          <Controller
                            name="category"
                            control={control}
                            rules={{ required: 'Category is required' }}
                            render={({ field }) => (
                              <Select
                                label="Category"
                                placeholder="Select a category"
                                selectedKeys={field.value ? [field.value] : []}
                                onSelectionChange={(keys) => field.onChange(Array.from(keys)[0])}
                                isRequired
                                isInvalid={!!errors.category}
                                errorMessage={errors.category?.message}
                              >
                                {categories.map((category) => (
                                  <SelectItem key={category._id} textValue={category.name}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </Select>
                            )}
                          />
                          
                          <Controller
                            name="sellingPrice"
                            control={control}
                            rules={{ 
                              required: 'Selling price is required',
                              pattern: {
                                value: /^[0-9]*\.?[0-9]+$/,
                                message: 'Please enter a valid price'
                              }
                            }}
                            render={({ field }) => (
                              <Input
                                type="number"
                                label="Selling Price"
                                placeholder="0.00"
                                value={field.value}
                                onValueChange={field.onChange}
                                isRequired
                                startContent={
                                  <div className="pointer-events-none flex items-center">
                                    <span className="text-default-400 text-small">৳</span>
                                  </div>
                                }
                                isInvalid={!!errors.sellingPrice}
                                errorMessage={errors.sellingPrice?.message}
                              />
                            )}
                          />
                          
                          <Controller
                            name="stockLocation"
                            control={control}
                            render={({ field }) => (
                              <Select
                                label="Initial Stock Location"
                                placeholder="Select location"
                                selectedKeys={[field.value]}
                                onSelectionChange={(keys) => field.onChange(Array.from(keys)[0])}
                              >
                                <SelectItem key="warehouse" textValue="Warehouse">
                                  Warehouse
                                </SelectItem>
                                <SelectItem key="shop" textValue="Shop">
                                  Shop
                                </SelectItem>
                              </Select>
                            )}
                          />
                          
                          <Controller
                            name="sku"
                            control={control}
                            render={({ field }) => (
                              <Input
                                label="SKU (Optional)"
                                placeholder="Leave empty to auto-generate"
                                value={field.value}
                                onValueChange={field.onChange}
                                description="If left empty, SKU will be auto-generated"
                              />
                            )}
                          />
                          
                          <Controller
                            name="barcode"
                            control={control}
                            render={({ field }) => (
                              <Input
                                label="Barcode (Optional)"
                                placeholder="Enter barcode"
                                value={field.value}
                                onValueChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                        
                        <Controller
                          name="description"
                          control={control}
                          render={({ field }) => (
                            <Textarea
                              label="Description"
                              placeholder="Enter product description"
                              value={field.value}
                              onValueChange={field.onChange}
                            />
                          )}
                        />
                      </CardBody>
                    </Card>
                    
                    {/* Batches */}
                    <Card>
                      <CardHeader className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold">Inventory Batches</h3>
                          <p className="text-sm text-default-500">
                            Add initial inventory batches. Total quantity will be added to selected stock location.
                          </p>
                        </div>
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
                          <div key={index} className="border rounded-lg p-4 bg-default-50">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-medium flex items-center gap-2">
                                <Package size={16} />
                                Batch #{index + 1}
                              </h4>
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
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                min="1"
                              />
                              
                              <Input
                                type="number"
                                label="Unit Cost"
                                placeholder="0.00"
                                value={batch.unitCost.toString()}
                                onValueChange={(value) => handleBatchChange(index, 'unitCost', parseFloat(value) || 0)}
                                isRequired
                                min="0"
                                startContent={
                                  <div className="pointer-events-none flex items-center">
                                    <span className="text-default-400 text-small">৳</span>
                                  </div>
                                }
                              />
                              
                              <Input
                                label="Supplier"
                                placeholder="Enter supplier name"
                                value={batch.supplier}
                                onValueChange={(value) => handleBatchChange(index, 'supplier', value)}
                              />
                              
                              <Input
                                label="Batch Number"
                                placeholder="Auto-generated if empty"
                                value={batch.batchNumber}
                                onValueChange={(value) => handleBatchChange(index, 'batchNumber', value)}
                                description="Leave empty for auto-generation"
                              />
                            </div>
                          </div>
                        ))}
                        
                        {batches.length > 0 && (
                          <div className="mt-4 p-3 bg-primary-50 rounded-lg">
                            <p className="text-sm font-medium text-primary-700">
                              Total Quantity: {batches.reduce((sum, batch) => sum + batch.quantity, 0)} units
                            </p>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </div>
                </form>
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="default" 
                  variant="light" 
                  onPress={onClose}
                >
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleFormSubmit}
                  isLoading={isLoading}
                  startContent={<Save size={16} />}
                >
                  Create Product
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}