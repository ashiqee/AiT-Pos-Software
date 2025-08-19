import {
  LayoutDashboard,
  Package,
  CarTaxiFront,
  ShoppingCart,
  BarChart3,
  Users,
  Settings,
  FileUp,
  SatelliteDish,
} from "lucide-react";

export const roleBasedSidebarMenu: Record<
  "admin" | "manager" | "salesmen" | "customer",
  {
    title: string;
    collapsible?: boolean;
    items: { label: string; href: string; icon?: any }[];
  }[]
> = {
  admin: [
    {
      title: "Dashboard",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        // { label: "Reports", href: "/dashboard/report", icon: BarChart3 },
        // { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      ],
    },
    {
      title: "Products",
      collapsible: true,
      items: [
        { label: "Products", href: "/dashboard/products", icon: Package },
        { label: "Categories", href: "/dashboard/categories", icon: Package },
        { label: "Import Product", href: "/dashboard/products/import", icon: FileUp },
      ],
    },
    {
      title: "Purchases",
      collapsible: true,
      items: [
        { label: "Purchases", href: "/dashboard/purchases", icon: CarTaxiFront },
        { label: "Purchases Reports", href: "/dashboard/purchases/reports", icon: FileUp },
      ],
    },
    {
      title: "Sales",
      collapsible: true,
      items: [
       { label: "Sales", href: "/dashboard/sales", icon: ShoppingCart },
        { label: "POS", href: "/pos", icon: SatelliteDish },
      ],
     
    },
    {
      title: "Reports",
      items: [{ label: "Reports", href: "/dashboard/reports", icon: BarChart3 }],
    },
    {
      title: "Customers",
      items: [{ label: "Customers", href: "/dashboard/customers", icon: Users }],
    },
    {
      title: "Users Manage",
      items: [{ label: "Users Manage", href: "/dashboard/users", icon: Users }],
    },
    // {
    //   title: "Settings",
    //   items: [{ label: "Settings", href: "/settings", icon: Settings }],
    // },
  ],

  manager: [
    {
      title: "Dashboard",
      items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
    },
    {
      title: "Products",
      collapsible: true,
      items: [
        { label: "Products", href: "/dashboard/products", icon: Package },
        { label: "Categories", href: "/dashboard/categories", icon: Package },
      ],
    },
    {
      title: "Purchases",
      collapsible: true,
      items: [{ label: "Purchases", href: "/dashboard/purchases", icon: CarTaxiFront }],
    },
    {
      title: "Sales",
      items: [{ label: "Sales", href: "/dashboard/sales", icon: ShoppingCart }],
    },
  ],

  salesmen: [
    {
      title: "Dashboard",
      items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
    },
    {
      title: "Sales",
      items: [{ label: "Sales", href: "/dashboard/sales", icon: ShoppingCart },
         { label: "POS", href: "/pos", icon: SatelliteDish },
      ],
    },
    {
      title: "Customers",
      items: [{ label: "Customers", href: "/dashboard/customers", icon: Users }],
    },
  ],

  customer: [
    {
      title: "Dashboard",
      items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
    },
    {
      title: "Orders",
      items: [{ label: "My Orders", href: "/dashboard/orders", icon: ShoppingCart }],
    },
    {
      title: "Wishlist",
      items: [{ label: "My Wishlist", href: "/dashboard/wishlist", icon: Package }],
    },
    {
      title: "Settings",
      items: [{ label: "Profile Settings", href: "/settings", icon: Settings }],
    },
  ],
};
