import { ReactNode, SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};


export interface IInput{
  variant?: "flat"|"bordered"|"faded"|"underlined";
  size?:"sm"|"md"|"lg";
  isRequired?:boolean;
  type?:string;
  label:string;
  name:string;
  disable?:boolean;

}

export interface IUser{
  _id: string;
  name: string;
  role: string;
  email: string;
  status: string;
  mobileNumber: string;
  profilePhoto: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}




export type Role = 'admin' | 'manager' | 'salesmen' | 'customer';

// @/types/index.ts or wherever your type is
export type MenuLink = {
  icon: () => JSX.Element;
  name: string;
  href: string;
  roles: string[];
};


export type Course = {
  _id: string;
  title: string;
  description?: string;
  image?: string;
  category?: string;
  progress?:number;
  slug: string;
  createdAt: string;
  updatedAt: string;
};


// product type 
export interface Product {
  _id?:string;
  name: string;
  description?: string;
  sellingPrice: number;
  batches: [{
    purchaseDate: Date;
    quantity: number;
    unitCost: number;
    supplier?: string;
    batchNumber: string;
  }],
  category: string;
  sku?: string;
  barcode?: string;
  imageUrl?: string;
}
