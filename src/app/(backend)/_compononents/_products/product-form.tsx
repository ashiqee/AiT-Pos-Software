'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';


export function ProductForm({ product, categories }:any) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    cost: product?.cost || '',
    quantity: product?.quantity || '',
    category: product?.category || '',
    sku: product?.sku || '',
    barcode: product?.barcode || '',
  });

  const router = useRouter();

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    const url = product ? `/api/products/${product._id}` : '/api/products';
    const method = product ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) router.push('/products');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Product Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <Input
        label="Price"
        type="number"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
        required
      />
      <Input
        label="Cost"
        type="number"
        value={formData.cost}
        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
        required
      />
      <Input
        label="Quantity"
        type="number"
        value={formData.quantity}
        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
        required
      />
      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        >
          <option value="">Select a category</option>
          {categories?.map((category:any) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit">{product ? 'Update' : 'Create'} Product</Button>
    </form>
  );
}