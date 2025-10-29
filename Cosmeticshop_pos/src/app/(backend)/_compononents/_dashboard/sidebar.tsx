'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Users,
  ChevronDown,
  ChevronRight,
  CarTaxiFront,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const navigation = [
  {
    name: 'Dashboard',
    
    icon: LayoutDashboard,
    subMenu: [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Reports', href: '/dashboard/report' },
      { name: 'Analytics', href: '/dashboard/analytics' },
    ],
  },
  { name: 'Products',  icon: Package,
    subMenu: [
      { name: 'Products', href: '/dashboard/products' },
       { name: 'Categories', href: '/dashboard/categories', icon: Package },
       { name: 'Import Product', href: '/dashboard/products/import' },
     
    ],
   },
 
  { name: 'Purchases', href: '/dashboard/purchases', icon: CarTaxiFront,
    subMenu: [
      { name: 'Purchases', href: '/dashboard/purchases', },
       { name: 'Purchases Reports', href: '/dashboard/purchases/reports', icon: Package },
       
     
    ],
   },
  { name: 'Sales', href: '/dashboard/sales', icon: ShoppingCart },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto border-r">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-xl font-bold text-gray-900">POS System</h1>
        </div>
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || item.subMenu?.some(sub => pathname === sub.href);
              const isOpen = openMenus.includes(item.name);

              if (item.subMenu) {
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={cn(
                        isActive
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        'group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md focus:outline-none'
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500',
                          'mr-3 h-6 w-6'
                        )}
                      />
                      <span className="flex-1 text-left">{item.name}</span>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 ml-auto text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="ml-9 mt-1 space-y-1">
                        {item.subMenu.map((subItem) => {
                          const subActive = pathname === subItem.href;
                          return (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className={cn(
                                subActive
                                  ? 'text-primary-600 font-medium'
                                  : 'text-gray-500 hover:text-gray-700',
                                'block text-sm'
                              )}
                            >
                              {subItem.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 flex-shrink-0 h-6 w-6'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <button className="group block w-full flex-shrink-0">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  Sign out
                </p>
              </div>
              <LogOut className="ml-auto h-5 w-5 text-gray-400 group-hover:text-gray-500" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
