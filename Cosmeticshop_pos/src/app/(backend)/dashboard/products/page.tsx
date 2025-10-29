"use client";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Badge, ScrollShadow } from "@heroui/react";
import {
  Plus,
  Upload,
  Search,
  Edit,
  Trash2,
  Package,
  Barcode,
} from "lucide-react";
import { useProducts } from "@/app/hooks/useProducts";
import AddProductModal from "../../_compononents/_products/_modals/AddProductModal";
import { StockChip } from "../../_compononents/_dashboard/_ui/StockChip";
import DeleteAlert from "../../_compononents/_products/_modals/DeleteAlert";
import EditProductModal from "../../_compononents/_products/_modals/EditProductModal";
import ViewProductDetailsModal from "../../_compononents/_products/_modals/ViewProductDetailsModal";
import { useUser } from "@/app/hooks/useUser";

export default function ProductsManagePage() {
  const {role,loading}=useUser()
  const {
    products,
    summary,
    pagination,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    barcode,
    setBarcode,
    stockFilter,
    setStockFilter,
    currentPage,
    goToPage,
    nextPage,
    prevPage,
    refreshProducts,
    clearFilters,
  } = useProducts();

  // Clear barcode search
  const clearBarcode = () => setBarcode(null);

 

  return (
    <div>
      {/* Header Section */}
      <div className="flex w-full flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="w-full ">
          <h1 className="text-xl lg:text-2xl font-bold">Product Management</h1>
          <p className="text-gray-600">Manage your product inventory</p>
        </div>

        <div className="flex justify-end gap-3 w-full ">
          <Link href="/dashboard/products/import">
            <Button
              color="primary"
              variant="flat"
              startContent={<Upload size={16} />}
              className="w-full "
            >
              Bulk Import
            </Button>
          </Link>
          <AddProductModal onProductAdded={refreshProducts}/>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Package size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-xl font-bold">
                  {summary?.totalProducts ?? 0}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Package size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">In Stock</p>
                <p className="text-xl font-bold">
                  {summary?.inStockCount ?? 0}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <Package size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-xl font-bold">
                  {summary?.lowStockCount ?? 0}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <Package size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Out of Stock</p>
                <p className="text-xl font-bold">
                  {summary?.outOfStockCount ?? 0}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody className="p-4">
            <div className="flex items-center text-red-700">
              <Package className="mr-2" />
              <span>{error}</span>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardBody className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search products by name, SKU, or category..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={<Search size={16} />}
              className="w-full md:w-96"
              disabled={!!barcode}
            />

            <div className="flex gap-2">
              <Input
                placeholder="Scan or enter barcode..."
                value={barcode || ""}
                onValueChange={setBarcode}
                startContent={<Barcode size={16} />}
                className="w-full md:w-96"
              />
              {barcode && (
                <Button color="danger" variant="light" onPress={clearBarcode}>
                  Clear
                </Button>
              )}
            </div>

           <ScrollShadow className="w-72 md:w-full ">

             <div className="flex gap-2">
              <Button
                variant="flat"
                size="sm"
                color={stockFilter === null ? "primary" : "default"}
                onPress={() => setStockFilter(null)}
              >
                All
              </Button>
              <Button
                variant="flat"
                size="sm"
                color={stockFilter === "high" ? "primary" : "default"}
                onPress={() => setStockFilter("high")}
              >
                High Stock
              </Button>
              <Button
                variant="flat"
                size="sm"
                color={stockFilter === "low" ? "primary" : "default"}
                onPress={() => setStockFilter("low")}
              >
                Low Stock
              </Button>
              <Button
                variant="flat"
                size="sm"
                color={stockFilter === "out" ? "primary" : "default"}
                onPress={() => setStockFilter("out")}
              >
                Out of Stock
              </Button>
            </div>
           </ScrollShadow>
          </div>
        </CardBody>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">All Products</h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="text-center py-4">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-4">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No products found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {barcode
                  ? "No product found with this barcode"
                  : "Try adjusting your search or create a new product"}
              </p>
              <div className="mt-6">
                <Link href="/dashboard/products/create">
                  <Button color="primary">
                    <Plus size={16} className="mr-1" />
                    Add Product
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <Table aria-label="Products table">
              <TableHeader>
                <TableColumn>PRODUCT</TableColumn>
                <TableColumn>PRICE</TableColumn>
                <TableColumn>Total Sold</TableColumn>
                <TableColumn>STOCK</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell>
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
                            <span className="text-gray-500 text-xs">IMG</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            {product.sku}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>${product.sellingPrice.toFixed(2)}</TableCell>
                    <TableCell>{product.totalSold}</TableCell>
                    <TableCell>{product.availableStock}</TableCell>
                    <TableCell>
                    <StockChip stockLevel={product.stockLevel} />

                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <ViewProductDetailsModal product={product} />
                       {
                        role === "admin" && <>
                        <EditProductModal product={product} onProductUpdated={refreshProducts}/>
                      <DeleteAlert id={product._id} onProductUpdated={refreshProducts}/>
                        </>
                       }
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
      {/* // Add pagination controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-2">
            <Button
              isDisabled={!pagination.hasPrev}
              variant="flat"
              size="sm"
              onPress={prevPage}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <Button
              isDisabled={!pagination.hasNext}
              variant="flat"
              size="sm"
              onPress={nextPage}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
