import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface User {
  _id: string;
  name: string;
  email?: string;
  mobileNo?: string;
  studentId?: string;
  profilePic?: string;
  status: 'active' | 'inactive';
  role: 'super-admin' | 'admin' | 'manager' | 'salesmen' | 'customer';
  designation?: string;
  createdAt: string;
  updatedAt: string;
}

interface UsersResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: ''
  });

  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      const response = await fetch(`/api/auth/users?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const createUser = async (userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      const newUser = await response.json();
      setUsers(prev => [newUser, ...prev]);
      toast.success('User created successfully');
      return newUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateUser = async (id: string, userData: Partial<User>) => {
    try {
      const response = await fetch(`/api/auth/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      const updatedUser = await response.json();
      setUsers(prev => prev.map(user => user._id === id ? updatedUser : user));
      toast.success('User updated successfully');
      return updatedUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const response = await fetch(`/api/auth/users/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      setUsers(prev => prev.filter(user => user._id !== id));
      toast.success('User deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    users,
    pagination,
    isLoading,
    error,
    filters,
    setFilters,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser
  };
}