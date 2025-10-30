'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { toast } from 'sonner';
import Select, { 
  components, 
  ControlProps, 
  MenuProps, 
  OptionProps, 
  SingleValueProps,
  StylesConfig,
  GroupBase,
  ClearIndicatorProps,
  DropdownIndicatorProps,
} from 'react-select';

import { 
  Package, 
  Search, 
  ArrowRightLeft,
  Filter,
  X
} from 'lucide-react';
import { useInventoryTransactions } from '@/app/hooks/useInventoryTransactions';
import { useAllProducts } from '@/app/hooks/useAllProduct';
import { Input } from '@heroui/input';

interface TransferFormData {
  productId: string;
  fromLocation: 'warehouse' | 'shop';
  toLocation: 'warehouse' | 'shop';
  quantity: number;
  notes?: string;
}

type ProductOption = {
  value: string;
  label: string;
  sku?: string;
  imageUrl?: string;
  description?: string;
  searchTerms: string;
};

// Custom styles for react-select
export const selectStyles: StylesConfig<any, false, GroupBase<any>> = {
  control: (base: any) => ({
    ...base,
    minHeight: '42px',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#d1d5db',
    },
    '&:focus-within': {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    },
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 50,
  }),
  menuList: (base: any) => ({
    ...base,
    padding: '0.25rem',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? '#f3f4f6' : 'white',
    color: state.isSelected ? '#111827' : '#374151',
    padding: '0.5rem 0.7rem',
    margin: '0.125rem',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#f9fafb',
    },
    '&:active': {
      backgroundColor: '#f3f4f6',
    },
  }),
  singleValue: (base: any) => ({
    ...base,
    color: '#111827',
    fontWeight: '500',
  }),
  placeholder: (base: any) => ({
    ...base,
    color: '#9ca3af',
  }),
  clearIndicator: (base: any) => ({
    ...base,
    padding: '0.25rem',
    '&:hover': {
      backgroundColor: '#f3f4f6',
      borderRadius: '0.25rem',
    },
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    padding: '0.25rem',
    '&:hover': {
      backgroundColor: '#f3f4f6',
      borderRadius: '0.25rem',
    },
  }),
  noOptionsMessage: (base: any) => ({
    ...base,
    padding: '0.5rem 0.75rem',
    color: '#9ca3af',
  }),
};

// Custom Control Component with search
const Control = ({ children, ...props }: ControlProps<any, false, GroupBase<any>>) => (
  <components.Control {...props}>
    {children}
  </components.Control>
);

// Custom Option Component with product details
const Option = ({ children, ...props }: OptionProps<ProductOption, false, GroupBase<ProductOption>>) => {
  const product = props.data as any;
  
  return (
    <components.Option {...props}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.label}
              className="w-8 h-8 rounded object-cover"
            />
          ) : (
            <Package size={16} className="text-gray-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{product.label}</div>
          <div className="text-xs text-gray-500 truncate">SKU: {product.sku}</div>
          {product.description && (
            <div className="text-xs text-gray-400 truncate">{product.description}</div>
          )}
        </div>
      </div>
    </components.Option>
  );
};

// Custom SingleValue Component
const SingleValue = ({ children, ...props }: SingleValueProps<ProductOption, false, GroupBase<ProductOption>>) => {
  const product = props.data as any;
  
  return (
    <components.SingleValue {...props}>
      <div className="flex items-center gap-2">
        {product.imageUrl && (
          <img
            src={product.imageUrl}
            alt={product.label}
            className="w-6 h-6 rounded object-cover"
          />
        )}
        <span className="truncate">{children}</span>
      </div>
    </components.SingleValue>
  );
};

// Custom Clear Indicator
const ClearIndicator = (props: ClearIndicatorProps<ProductOption, false, GroupBase<ProductOption>>) => (
  <components.ClearIndicator {...props}>
    <X size={16} />
  </components.ClearIndicator>
);

// Custom Dropdown Indicator
const DropdownIndicator = (props: DropdownIndicatorProps<ProductOption, false, GroupBase<ProductOption>>) => (
  <components.DropdownIndicator {...props}>
    <Filter size={16} />
  </components.DropdownIndicator>
);

// Custom Menu component to highlight search text
const Menu = (props: MenuProps<any, false, GroupBase<any>>) => {
  const { selectProps } = props;
  const inputValue = selectProps.inputValue || '';
  
  return (
    <components.Menu {...props}>
      {props.children}
      {inputValue && (
        <div className="px-3 py-2 text-xs text-gray-500 border-t">
          Showing results for "{inputValue}"
        </div>
      )}
    </components.Menu>
  );
};

// Custom option with highlighted search text
const highlightText = (text: string, highlight: string) => {
  if (!highlight) return text;
  
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span>
      {parts.map((part, index) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={index} className="bg-yellow-200 px-1 rounded">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
};

// Enhanced Option with highlighted search
const HighlightedOption = ({ children, ...props }: OptionProps<ProductOption, false, GroupBase<ProductOption>>) => {
  const product = props.data as any;
  const inputValue = props.selectProps.inputValue || '';
  
  return (
    <components.Option {...props}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.label}
              className="w-8 h-8 rounded object-cover"
            />
          ) : (
            <Package size={16} className="text-gray-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {highlightText(product.label, inputValue)}
          </div>
          <div className="text-xs text-gray-500 truncate">
            SKU: {highlightText(product.sku, inputValue)}
          </div>
          {product.description && (
            <div className="text-xs text-gray-400 truncate">
              {highlightText(product.description, inputValue)}
            </div>
          )}
        </div>
      </div>
    </components.Option>
  );
};

// Custom filter option for react-select
const filterOption = (option: any, inputValue: string) => {
  const product = option.data as any;
  const searchLower = inputValue.toLowerCase();
  
  return product.searchTerms.includes(searchLower);
};

// Custom no options message
const noOptionsMessage = ({ inputValue }: { inputValue: string }) => {
  return inputValue ? `No products found for "${inputValue}"` : 'No products available';
};

export default function CreateTransferModal() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    createTransfer, 
    completeTransfer,
  } = useInventoryTransactions();
  const { products } = useAllProducts();

  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState<TransferFormData>({
    productId: '',
    fromLocation: 'warehouse',
    toLocation: 'shop',
    quantity: 1, // Changed default to 1 instead of 0
    notes: ''
  });

  // Convert products to select options with enhanced search terms
  const productOptions: ProductOption[] = products ? products.map(product => ({
    value: product._id,
    label: product.name,
    sku: product.sku,
    imageUrl: product.imageUrl,
    description: product.description,
    searchTerms: `${product.name} ${product.sku} ${product.description || ''}`.toLowerCase()
  })) : [];

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.productId || formData.quantity <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.fromLocation === formData.toLocation) {
      toast.error('Source and destination locations cannot be the same');
      return;
    }

    setIsCreating(true);
    try {
      await createTransfer(formData);
      toast.success('Transfer created successfully');
      onClose();
      // Reset form
      setFormData({
        productId: '',
        fromLocation: 'warehouse',
        toLocation: 'shop',
        quantity: 1,
        notes: ''
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create transfer');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <Button 
        color="primary" 
        startContent={<ArrowRightLeft size={16} />}
        onPress={onOpen}
      >
        New Transfer
      </Button>
      {/* New Transfer Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl font-bold">Create New Transfer</h2>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product <span className="text-red-500">*</span>
                </label>
                <Select
                  options={productOptions}
                  value={productOptions.find(option => option.value === formData.productId)}
                  onChange={(selectedOption) => {
                    setFormData(prev => ({ ...prev, productId: selectedOption?.value || '' }));
                  }}
                  placeholder="Search by product name or SKU..."
                  styles={selectStyles}
                  components={{ 
                    Control,
                    Option: HighlightedOption,
                    SingleValue,
                    ClearIndicator,
                    DropdownIndicator,
                    Menu
                  }}
                  isClearable
                  isSearchable
                  filterOption={filterOption}
                  noOptionsMessage={noOptionsMessage}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Location <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={[
                      { value: 'warehouse', label: 'Warehouse' },
                      { value: 'shop', label: 'Shop' }
                    ]}
                    value={{ value: formData.fromLocation, label: formData.fromLocation.charAt(0).toUpperCase() + formData.fromLocation.slice(1) }}
                    onChange={(selectedOption) => setFormData(prev => ({ ...prev, fromLocation: selectedOption?.value as 'warehouse' | 'shop' }))}
                    styles={selectStyles}
                    components={{ Control }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Location <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={[
                      { value: 'warehouse', label: 'Warehouse' },
                      { value: 'shop', label: 'Shop' }
                    ]}
                    value={{ value: formData.toLocation, label: formData.toLocation.charAt(0).toUpperCase() + formData.toLocation.slice(1) }}
                    onChange={(selectedOption) => setFormData(prev => ({ ...prev, toLocation: selectedOption?.value as 'warehouse' | 'shop' }))}
                    styles={selectStyles}
                    components={{ Control }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  value={formData.quantity.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, quantity: parseInt(value) || 0 }))}
                  min={1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <Input
                  placeholder="Add any notes about this transfer"
                  value={formData.notes}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button 
              color="primary" 
              onPress={handleSubmit}
              isLoading={isCreating}
            >
              Create Transfer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}