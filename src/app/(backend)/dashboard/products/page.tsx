import Link from "next/link";

export default function ProductsManagePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Products Management</h1>

      <div className="flex flex-col gap-4">
        {/* Bulk Import Button */}
        <Link
          href="/dashboard/products/import"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          Bulk Import
        </Link>

        {/* Add Product Button */}
        <Link
          href="/dashboard/products/add"
          className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
        >
          Add New Product
        </Link>

        {/* Manage Existing Products */}
        <Link
          href="/dashboard/products/list"
          className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition"
        >
          Manage Products
        </Link>
      </div>
    </div>
  );
}
