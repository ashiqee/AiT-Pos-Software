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




export type Role = "super-admin"|"admin" | "teacher" | "student" | "guest";

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
