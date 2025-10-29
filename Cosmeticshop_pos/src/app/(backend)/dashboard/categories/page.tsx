'use client';

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Input } from '@heroui/input';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Badge } from '@heroui/badge';
import { Plus, Edit, Trash2, Image } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  createdAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Open modal for creating/editing
  const openModal = (category?: Category) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        name: '',
        description: '',
        imageUrl: '',
      });
    }
    onOpen();
  };

  // Handle form submission
  const handleSubmit = async () => {
    // e.preventDefault();
    setIsSubmitting(true);

    console.log("click");
    

    try {
      const url = selectedCategory 
        ? `/api/categories/${selectedCategory._id}`
        : '/api/categories';
      const method = selectedCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchCategories();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open delete confirmation
  const openDeleteModal = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  // Handle category deletion
  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await fetch(`/api/categories/${categoryToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCategories();
        setIsDeleteModalOpen(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-gray-600">Manage product categories</p>
        </div>
        <Button color="primary" startContent={<Plus size={16} />} onPress={() => openModal()}>
          Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">All Categories</h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="text-center py-8">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No categories found. Create your first category to get started.
            </div>
          ) : (
            <Table aria-label="Categories table">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>DESCRIPTION</TableColumn>
                <TableColumn>IMAGE</TableColumn>
                <TableColumn>PRODUCTS</TableColumn>
                <TableColumn>CREATED</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category._id}>
                    <TableCell>
                      <div className="font-medium">{category.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {category.description || 'No description'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {category.imageUrl ? (
                        <div className="flex items-center">
                          <Image size={16} className="text-green-500 mr-1" />
                          <span className="text-sm">Has image</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No image</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge color="primary" variant="flat">
                        {/* This would be populated with actual product count */}
                        0 products
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => openModal(category)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => openDeleteModal(category)}
                        >
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

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {selectedCategory ? 'Edit Category' : 'Add New Category'}
              </ModalHeader>
              <ModalBody>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Category Name"
                    placeholder="Enter category name"
                    value={formData.name}
                    onValueChange={(value) => setFormData({ ...formData, name: value })}
                    isRequired
                  />
                  <Input
                    label="Description"
                    placeholder="Enter category description"
                    value={formData.description}
                    onValueChange={(value) => setFormData({ ...formData, description: value })}
                  />
                  <Input
                    label="Image URL"
                    placeholder="Enter image URL"
                    value={formData.imageUrl}
                    onValueChange={(value) => setFormData({ ...formData, imageUrl: value })}
                  />
                </form>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={handleSubmit}
                  isLoading={isSubmitting}
                >
                  {selectedCategory ? 'Update' : 'Create'} Category
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} size="md">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Delete Category</ModalHeader>
              <ModalBody>
                <p>
                  Are you sure you want to delete the category &#34;{categoryToDelete?.name}&#34;?
                  This action cannot be undone.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" variant="light" onPress={() => setIsDeleteModalOpen(false)}>
                  Cancel
                </Button>
                <Button color="danger" onPress={handleDelete}>
                  Delete Category
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}