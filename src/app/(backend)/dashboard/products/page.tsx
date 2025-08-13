import Link from "next/link";
import { ProductForm } from "../../_compononents/_products/product-form";

export default function ProductsManagePage() {
    return (
        <div>

            <Link href={'/dashboard/products/import'}>
            Bulk Import
            </Link>
            <ProductForm/>
        </div>
    );
}