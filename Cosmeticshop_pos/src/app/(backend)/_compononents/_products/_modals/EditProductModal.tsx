"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Plus, Trash2, Save, Edit, Upload, X } from "lucide-react";
import { addToast } from "@heroui/react";
import { toast } from "sonner";
import Image from "next/image";
import { useForm, Controller } from "react-hook-form";
import ImageUploader from "../_uploader/ImageUploader";

interface Batch {
  purchaseDate: string;
  quantity: number;
  unitCost: number;
  supplier: string;
  batchNumber: string;
  _id?: string;
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

// Global cache for categories to prevent multiple fetches
let categoriesCache: Category[] | null = null;
let categoriesPromise: Promise<Category[]> | null = null;

export default function EditProductModal({
  product,
  onProductUpdated,
}: EditProductModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [categories, setCategories] = useState<Category[]>(
    categoriesCache || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize form with react-hook-form
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      sellingPrice: "",
      category: "",
      sku: "",
      barcode: "",
      imageUrl: "",
      batches: [],
    },
  });

  // Batches state
  const [batches, setBatches] = useState<Batch[]>([]);

  // Fetch categories with caching
  const fetchCategories = useCallback(async () => {
    // Return cached categories if available
    if (categoriesCache) {
      return categoriesCache;
    }

    // Return existing promise if fetch is in progress
    if (categoriesPromise) {
      return await categoriesPromise;
    }

    // Start new fetch
    setIsCategoriesLoading(true);
    categoriesPromise = (async () => {
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await response.json();
        categoriesCache = data; // Cache the result
        setCategories(data);
        return data;
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast.error("Failed to load categories");
        throw error;
      } finally {
        setIsCategoriesLoading(false);
        categoriesPromise = null; // Reset promise
      }
    })();

    return await categoriesPromise;
  }, []);

  // Initialize form when product changes
  useEffect(() => {
    if (product && !isInitialized) {
      const formData = {
        name: product.name,
        description: product.description || "",
        sellingPrice: product.sellingPrice.toString(),
        category: product.category._id,
        sku: product.sku || "",
        barcode: product.barcode || "",
        imageUrl: product.imageUrl || "",
      };

      reset(formData);
      setIsInitialized(true);

      setBatches(
        product.batches.map((batch) => ({
          purchaseDate: new Date(batch.purchaseDate)
            .toISOString()
            .split("T")[0],
          quantity: batch.quantity,
          unitCost: batch.unitCost,
          supplier: batch.supplier || "",
          batchNumber: batch.batchNumber || "",
          _id: batch._id,
        }))
      );
    }
  }, [product, reset, isInitialized]);

  // Fetch categories only when modal opens
  useEffect(() => {
    if (isOpen && categories.length === 0 && !isCategoriesLoading) {
      fetchCategories();
    }
  }, [isOpen, categories.length, isCategoriesLoading, fetchCategories]);

  // Reset initialization state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen]);

  // Handle batch changes
  const handleBatchChange = (
    index: number,
    field: keyof Batch,
    value: string | number
  ) => {
    const newBatches = [...batches];
    newBatches[index] = { ...newBatches[index], [field]: value };
    setBatches(newBatches);
  };

  // Add a new batch
  const addBatch = () => {
    setBatches([
      ...batches,
      {
        purchaseDate: new Date().toISOString().split("T")[0],
        quantity: 0,
        unitCost: 0,
        supplier: "",
        batchNumber: "",
      },
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
    if (batches.some((batch) => batch.quantity <= 0 || batch.unitCost <= 0)) {
      toast.error("All batches must have valid quantity and unit cost");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data for API
      const payload = {
        ...data,
        sellingPrice: parseFloat(data.sellingPrice),
        batches: batches.map((batch) => ({
          ...batch,
          quantity: parseInt(batch.quantity as any),
          unitCost: parseFloat(batch.unitCost as any),
          purchaseDate: new Date(batch.purchaseDate),
        })),
      };

      const response = await fetch(`/api/products/${product._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update product");
      }

      const updatedProduct = await response.json();
      toast.success("Product updated successfully");

      // Notify parent component
      onProductUpdated();

      // Close modal
      onClose();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update product"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when modal closes
  const handleClose = () => {
    // Reset form to original values
    if (product) {
      const formData = {
        name: product.name,
        description: product.description || "",
        sellingPrice: product.sellingPrice.toString(),
        category: product.category._id,
        sku: product.sku || "",
        barcode: product.barcode || "",
        imageUrl: product.imageUrl || "",
      };

      reset(formData);

      setBatches(
        product.batches.map((batch) => ({
          purchaseDate: new Date(batch.purchaseDate)
            .toISOString()
            .split("T")[0],
          quantity: batch.quantity,
          unitCost: batch.unitCost,
          supplier: batch.supplier || "",
          batchNumber: batch.batchNumber || "",
          _id: batch._id,
        }))
      );
    }
    onClose();
  };

  // Get the current category name for display
  const getCurrentCategoryName = () => {
    if (!product || !product.category) return "";
    return product.category.name;
  };

  // Fixed form submission handler
  const handleFormSubmit = () => {
    handleSubmit(onSubmit)();
  };

  return (
    <>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={onOpen}
        className="text-primary"
      >
        <Edit size={16} />
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="5xl"
        scrollBehavior="inside"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
                <h2 className="text-xl font-bold">Edit Product</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Update product information and inventory
                </p>
              </ModalHeader>
              <ModalBody className="py-6">
                <form onSubmit={handleFormSubmit}>
                  <div className="space-y-6">
                    {/* Product Information */}
                    <Card className="shadow-sm border-1 border-gray-200 dark:border-gray-700">
                      <CardHeader className="bg-gray-50 dark:bg-gray-800/50 py-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <div className="w-1 h-6 bg-primary rounded-full"></div>
                          Product Information
                        </h3>
                      </CardHeader>
                      <CardBody className="py-5 space-y-4">
                        {/* Image Upload Section */}
                        <div className="pt-2">
                          <ImageUploader
                            name="imageUrl"
                            label="Product Image"
                            control={control}
                            setValue={setValue}
                            defaultValue={product?.imageUrl}
                          />
                        </div>
                         <Controller
                            name="name"
                            control={control}
                            rules={{ required: "Product name is required" }}
                            render={({ field }) => (
                              <Input
                                label="Product Name"
                                placeholder="Enter product name"
                                value={field.value}
                                onValueChange={field.onChange}
                                isRequired
                                isInvalid={!!errors.name}
                                errorMessage={errors.name?.message}
                                variant="bordered"
                                size="md"
                              />
                            )}
                          />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         

                       

                          <Controller
                            name="sellingPrice"
                            control={control}
                            rules={{
                              required: "Selling price is required",
                              pattern: {
                                value: /^[0-9]*\.?[0-9]+$/,
                                message: "Please enter a valid price",
                              },
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
                                    <span className="text-default-400 text-small">
                                      &#2547;{" "}
                                    </span>
                                  </div>
                                }
                                isInvalid={!!errors.sellingPrice}
                                errorMessage={errors.sellingPrice?.message}
                                variant="bordered"
                                size="md"
                              />
                            )}
                          />

                          <Controller
                            name="category"
                            control={control}
                            rules={{ required: "Category is required" }}
                            render={({ field }) => (
                              <Select
                                label="Category"
                                placeholder="Select a category"
                                selectedKeys={field.value ? [field.value] : []}
                                onSelectionChange={(keys) =>
                                  field.onChange(Array.from(keys)[0])
                                }
                                isRequired
                                isLoading={isCategoriesLoading}
                                disabled={isCategoriesLoading}
                                isInvalid={!!errors.category}
                                errorMessage={errors.category?.message}
                                variant="bordered"
                                size="md"
                                defaultSelectedKeys={
                                  product && product.category
                                    ? [product.category._id]
                                    : []
                                }
                              >
                                {categories.map((category) => (
                                  <SelectItem
                                    key={category._id}
                                    textValue={category.name}
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </Select>
                            )}
                          />
   <Controller
                            name="sku"
                            control={control}
                            render={({ field }) => (
                              <Input
                                label="SKU"
                                placeholder="Enter SKU"
                                readOnly
                                value={field.value}
                                onValueChange={field.onChange}
                                variant="bordered"
                                size="md"
                              />
                            )}
                          />
                          <Controller
                            name="barcode"
                            control={control}
                            render={({ field }) => (
                              <Input
                                label="Barcode"
                                readOnly
                                placeholder="Enter barcode"
                                value={field.value}
                                onValueChange={field.onChange}
                                variant="bordered"
                                size="md"
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
                              variant="bordered"
                              size="md"
                              rows={2}
                            />
                          )}
                        />
                      </CardBody>
                    </Card>

                    {/* Batches */}
                    <Card className="shadow-sm border-1 border-gray-200 dark:border-gray-700">
                      <CardHeader className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3 flex justify-between items-center">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <div className="w-1 h-6 bg-primary rounded-full"></div>
                          Inventory Batches
                        </h3>
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          startContent={<Plus size={16} />}
                          onPress={addBatch}
                          className="font-medium"
                        >
                          Add Batch
                        </Button>
                      </CardHeader>
                      <CardBody className="px-6 py-5">
                        {batches.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                            <p className="text-gray-500 mb-3">
                              No inventory batches added yet
                            </p>
                            <Button
                              size="sm"
                              color="primary"
                              variant="flat"
                              startContent={<Plus size={16} />}
                              onPress={addBatch}
                            >
                              Add First Batch
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {batches.map((batch, index) => (
                              <div
                                key={index}
                                className="border-1 border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50/50 dark:bg-gray-800/30"
                              >
                                <div className="flex justify-between items-center mb-4">
                                  <h4 className="font-medium text-base flex items-center gap-2">
                                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-sm">
                                      {index + 1}
                                    </div>
                                    Batch #{index + 1}
                                  </h4>
                                  {batches.length > 1 && (
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      color="danger"
                                      variant="light"
                                      onPress={() => removeBatch(index)}
                                      className="text-danger"
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
                                    onValueChange={(value) =>
                                      handleBatchChange(
                                        index,
                                        "purchaseDate",
                                        value
                                      )
                                    }
                                    variant="bordered"
                                    size="md"
                                  />

                                  <Input
                                    type="number"
                                    label="Quantity"
                                    placeholder="0"
                                    value={batch.quantity.toString()}
                                    onValueChange={(value) =>
                                      handleBatchChange(
                                        index,
                                        "quantity",
                                        parseInt(value) || 0
                                      )
                                    }
                                    isRequired
                                    variant="bordered"
                                    size="md"
                                  />

                                  <Input
                                    type="number"
                                    label="Unit Cost"
                                    placeholder="0.00"
                                    value={batch.unitCost.toString()}
                                    onValueChange={(value) =>
                                      handleBatchChange(
                                        index,
                                        "unitCost",
                                        parseFloat(value) || 0
                                      )
                                    }
                                    isRequired
                                    startContent={
                                      <div className="pointer-events-none flex items-center">
                                        <span className="text-default-400 text-small">
                                          &#2547;{" "}
                                        </span>
                                      </div>
                                    }
                                    variant="bordered"
                                    size="md"
                                  />

                                  <Input
                                    label="Supplier"
                                    placeholder="Enter supplier name"
                                    value={batch.supplier}
                                    onValueChange={(value) =>
                                      handleBatchChange(
                                        index,
                                        "supplier",
                                        value
                                      )
                                    }
                                    variant="bordered"
                                    size="md"
                                  />

                                  <Input
                                    label="Batch Number"
                                    placeholder="Enter batch number"
                                    value={batch.batchNumber}
                                    onValueChange={(value) =>
                                      handleBatchChange(
                                        index,
                                        "batchNumber",
                                        value
                                      )
                                    }
                                    variant="bordered"
                                    size="md"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </div>
                </form>
              </ModalBody>
              <ModalFooter className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4">
                <Button
                  color="default"
                  variant="flat"
                  onPress={handleClose}
                  className="font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  onPress={handleFormSubmit}
                  isLoading={isLoading}
                  startContent={<Save size={16} />}
                  className="font-medium"
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
