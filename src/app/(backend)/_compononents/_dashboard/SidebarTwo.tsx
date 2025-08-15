'use client';

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Menu } from "lucide-react";
import { roleBasedSidebarMenu } from "./sideBarmenu";


const SidebarSection = ({
  title,
  items,
  collapsible = false,
}: {
  title: string;
  items: { label: string; href: string; icon?: React.ElementType }[];
  collapsible?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(!collapsible);

  return (
    <div>
      <button
        className="flex items-center justify-between w-full text-gray-400 text-xs uppercase font-semibold tracking-wide px-3 py-2 hover:text-gray-600 dark:hover:text-white"
        onClick={() => collapsible && setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        {collapsible &&
          (isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
      </button>
      {isOpen && (
        <ul className="pl-3">
          {items.map((item, idx) => (
            <li key={idx}>
              <Link
                href={item.href}
                className="px-4 flex items-center gap-2 py-2 text-sm hover:text-gray-100 hover:bg-gray-800 rounded transition-colors"
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const SidebarTwo = ({
  role,
  collapsed,
  toggleCollapse,
}: {
  role: "admin" | "manager" | "salesman" | "customer";
  collapsed?: boolean;
  toggleCollapse: () => void;
}) => {
  const width = collapsed ? 'w-16' : 'w-64';
  const sidebarMenu = roleBasedSidebarMenu[role];

  return (
    <aside
      className={`fixed top-0 left-0 h-[calc(100vh-60px)] overflow-auto border-r border-gray-700/25 dark:bg-[#0D1117] dark:text-white transition-all duration-300 ${width} z-50`}
    >
      {/* Toggle Button */}
      <div className="flex justify-end p-2">
        <button onClick={toggleCollapse}>
          <Menu size={20} />
        </button>
      </div>

      {/* Menu Content */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-4 pb-4">
        {sidebarMenu.map((section, index) => (
          <SidebarSection
            key={index}
            title={section.title}
            items={section.items}
            collapsible={section.collapsible}
          />
        ))}
      </nav>
    </aside>
  );
};

export default SidebarTwo;