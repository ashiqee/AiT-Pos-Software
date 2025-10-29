'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Input } from '@heroui/input';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Badge } from '@heroui/badge';
import { Select, SelectItem } from '@heroui/select';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User as UserIcon,
  Mail,
  Phone,
  IdCard,
  Calendar
} from 'lucide-react';
import { useUsers } from '@/app/hooks/useUsers';
import { User } from 'next-auth';
import UserForm from './UserForm';
import { Image } from '@heroui/react';


export default function UsersManagementPage() {
  const {
    users,
    pagination,
    isLoading,
    error,
    filters,
    setFilters,
    createUser,
    updateUser,
    deleteUser
  } = useUsers();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'super-admin': 'danger',
      'admin': 'warning',
      'manager': 'primary',
      'salesmen': 'success',
      'customer': 'default'
    };
    return colors[role] || 'default';
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'danger';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-600">Manage system users and their roles</p>
        </div>
        <Button 
          color="primary" 
          startContent={<Plus size={16} />}
          onPress={() => {
            setEditingUser(null);
            onOpen();
          }}
        >
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody className="p-4">
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              startContent={<Search size={16} />}
              className="flex-1 min-w-[300px]"
            />
            <Select
              placeholder="Role"
              selectedKeys={filters.role ? [filters.role] : []}
              onSelectionChange={(keys) => setFilters(prev => ({ ...prev, role: Array.from(keys)[0] as string }))}
              className="w-48"
            >
              <SelectItem key="">All Roles</SelectItem>
              <SelectItem key="super-admin">Super Admin</SelectItem>
              <SelectItem key="admin">Admin</SelectItem>
              <SelectItem key="manager">Manager</SelectItem>
              <SelectItem key="salesmen">Salesmen</SelectItem>
              <SelectItem key="customer">Customer</SelectItem>
            </Select>
            <Select
              placeholder="Status"
              selectedKeys={filters.status ? [filters.status] : []}
              onSelectionChange={(keys) => setFilters(prev => ({ ...prev, status: Array.from(keys)[0] as string }))}
              className="w-48"
            >
              <SelectItem key="">All Status</SelectItem>
              <SelectItem key="active">Active</SelectItem>
              <SelectItem key="inactive">Inactive</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody className="p-4">
            <div className="text-red-700">{error}</div>
          </CardBody>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">System Users</h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or create a new user
              </p>
            </div>
          ) : (
            <>
              <Table aria-label="Users table">
                <TableHeader>
                  <TableColumn>USER</TableColumn>
                  <TableColumn>CONTACT</TableColumn>
                  <TableColumn>ROLE</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>CREATED</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {user.profilePic ? (
                            <Image
                              src={user.profilePic}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{user.name}</div>
                            {user.designation && (
                              <div className="text-sm text-gray-500">{user.designation}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {user.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail size={14} className="text-gray-400" />
                              <span>{user.email}</span>
                            </div>
                          )}
                          {user.mobileNo && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone size={14} className="text-gray-400" />
                              <span>{user.mobileNo}</span>
                            </div>
                          )}
                          {user.studentId && (
                            <div className="flex items-center gap-1 text-sm">
                              <IdCard size={14} className="text-gray-400" />
                              <span>{user.studentId}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                       
                          {user?.role?.replace('-', ' ')}
                    
                      </TableCell>
                      <TableCell>
                        <Badge color={getStatusColor(user.status)} variant="flat">
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar size={14} />
                          <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => {
                              setEditingUser(user);
                              onOpen();
                            }}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => deleteUser(user._id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      isDisabled={pagination.page === 1}
                      variant="flat"
                      size="sm"
                      onPress={() => {
                        const params = new URLSearchParams({
                          ...filters,
                          page: (pagination.page - 1).toString()
                        });
                        window.history.pushState({}, '', `/users?${params}`);
                      }}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      isDisabled={pagination.page === pagination.totalPages}
                      variant="flat"
                      size="sm"
                      onPress={() => {
                        const params = new URLSearchParams({
                          ...filters,
                          page: (pagination.page + 1).toString()
                        });
                        window.history.pushState({}, '', `/users?${params}`);
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* User Form Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <h2 className="text-xl font-bold">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h2>
              </ModalHeader>
              <ModalBody>
                <UserForm
                  user={editingUser}
                  onSubmit={async (userData:any) => {
                    try {
                      if (editingUser) {
                        await updateUser(editingUser._id, userData);
                      } else {
                        await createUser(userData);
                      }
                      onClose();
                    } catch (error) {
                      console.error('Error submitting form:', error);
                    }
                  }}
                  onCancel={onClose}
                />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}