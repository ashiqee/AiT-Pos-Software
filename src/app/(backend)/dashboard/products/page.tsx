"use client";

import Link from "next/link";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Badge } from "@heroui/badge";
import { Plus, Upload, Search, Edit, Trash2, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { useProducts } from "@/app/hooks/useProducts";
import Image from "next/image";


export default function ProductsManagePage() {
   const {
    products,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    refreshProducts
  } = useProducts();




  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Product Management</h1>
          <p className="text-gray-600">Manage your product inventory</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Link href="/dashboard/products/import">
            <Button 
              color="primary" 
              variant="flat" 
              startContent={<Upload size={16} />}
              className="w-full sm:w-auto"
            >
              Bulk Import
            </Button>
          </Link>
          <Link href="/dashboard/products/create">
            <Button 
              color="primary" 
              startContent={<Plus size={16} />}
              className="w-full sm:w-auto"
            >
              Add Product
            </Button>
          </Link>
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
                <p className="text-xl font-bold">{products.length}</p>
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
                  {products.filter(p => p.inStock).length}
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
                  {products.filter(p => p.stockLevel === "low").length}
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
                  {products.filter(p => !p.inStock).length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

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
            />
            <div className="flex gap-2">
              <Button variant="flat" size="sm">All</Button>
              <Button variant="flat" size="sm">Electronics</Button>
              <Button variant="flat" size="sm">Accessories</Button>
              <Button variant="flat" size="sm">Clothing</Button>
            </div>
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
            <div className="text-center py-8">Loading products...</div>
          ) : (
            <Table aria-label="Products table">
              <TableHeader>
                <TableColumn>PRODUCT</TableColumn>
                <TableColumn>CATEGORY</TableColumn>
                <TableColumn>PRICE</TableColumn>
                <TableColumn>STOCK</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-200 rounded-lg w-12 h-12 flex items-center justify-center">
                          {
                            product.imageUrl ? <>
                            
                            <Image
                            src={product.imageUrl}
                            alt={product.name}
                            width={400}height={400}
                            className="size-12 rounded-md"
                            />
                            </>:<span className="text-gray-500 text-xs">IMG</span>
                          }
                          
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.sku}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.category.name}</TableCell>
                    <TableCell>${product?.sellingPrice?.toFixed(2)}</TableCell>
                    <TableCell>{product.totalQuantity}</TableCell>
                    <TableCell>
                      <Badge 
                        color={
                          product.stockLevel === "high" ? "success" : 
                          product.stockLevel === "medium" ? "warning" : 
                          product.stockLevel === "low" ? "danger" : "default"
                        }
                        variant="flat"
                      >
                        {product.stockLevel === "high" ? "In Stock" : 
                         product.stockLevel === "medium" ? "Medium Stock" : 
                         product.stockLevel === "low" ? "Low Stock" : "Out of Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button isIconOnly size="sm" variant="light">
                          <Edit size={16} />
                        </Button>
                        <Button isIconOnly size="sm" variant="light" color="danger">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}