"use client";

import { useFormContext } from "react-hook-form";

type Props = {
  name: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
   defaultValue?: any;
  rows?: number;
};

export const ASTextarea = ({
  name,
  label,
  required = false,
  defaultValue,
  placeholder = "",
  rows = 4,
}: Props) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        {...register(name, { required: required && "This field is required" })}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={`w-full border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
};
