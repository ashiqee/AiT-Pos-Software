'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Divider } from '@heroui/divider';
import { User as UserIcon, Mail, Phone, IdCard, Briefcase } from 'lucide-react';

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
  password?: string;
}

interface UserFormProps {
  user?: User | null;
  onSubmit: (userData: Partial<User>) => Promise<void>;
  onCancel: () => void;
}

export default function UserForm({ user, onSubmit, onCancel }: UserFormProps) {
 const [formData, setFormData] = useState({
  name: user?.name || '',
  email: user?.email || '',
  mobileNo: user?.mobileNo || '',
  studentId: user?.studentId || '',
  profilePic: user?.profilePic || '',
  status: user?.status || 'active',
  role: user?.role || 'customer',
  designation: user?.designation || '',
  password: ''
});


  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    if (!user && !formData.password) {
      newErrors.password = 'Password is required for new users';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData: Partial<User> = { ...formData };
    
    // Only include password if it's provided
    if (!formData.password) {
      delete submitData.password;
    }

    try {
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Name"
          placeholder="Enter full name"
          value={formData.name}
          onValueChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
          isRequired
          errorMessage={errors.name}
          startContent={<UserIcon size={16} />}
        />
<Select
  label="Role"
  placeholder="Select a role"
  selectedKeys={formData.role ? [formData.role] : []}
  onSelectionChange={(keys) =>
    setFormData((prev) => ({
      ...prev,
      role: Array.from(keys)[0] as User["role"],
    }))
  }
  isRequired
  isInvalid={!!errors.role}
  errorMessage={errors.role}
>
  <SelectItem key="super-admin">Super Admin</SelectItem>
  <SelectItem key="admin">Admin</SelectItem>
  <SelectItem key="manager">Manager</SelectItem>
  <SelectItem key="salesmen">Salesmen</SelectItem>
  <SelectItem key="customer">Customer</SelectItem>
</Select>


        <Input
          label="Email"
          placeholder="Enter email address"
          value={formData.email}
          onValueChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
          startContent={<Mail size={16} />}
        />

        <Input
          label="Mobile Number"
          placeholder="Enter mobile number"
          value={formData.mobileNo}
          onValueChange={(value) => setFormData(prev => ({ ...prev, mobileNo: value }))}
          startContent={<Phone size={16} />}
        />

       

        <Input
          label="Designation"
          placeholder="Enter job title"
          value={formData.designation}
          onValueChange={(value) => setFormData(prev => ({ ...prev, designation: value }))}
          startContent={<Briefcase size={16} />}
        />

      

        <Input
          label="Profile Picture URL"
          placeholder="Enter image URL"
          value={formData.profilePic}
          onValueChange={(value) => setFormData(prev => ({ ...prev, profilePic: value }))}
        />

        <Input
          label="Password"
          type="password"
          placeholder={user ? "Leave blank to keep current password" : "Enter password"}
          value={formData.password}
          onValueChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
          isRequired={!user}
          errorMessage={errors.password}
        />
      </div>

      <Divider />

      <div className="flex justify-end gap-3">
        <Button color="primary" variant="light" onPress={onCancel}>
          Cancel
        </Button>
        <Button color="primary" type="submit">
          {user ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}