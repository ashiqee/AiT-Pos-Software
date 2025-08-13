"use client";
import { useFormContext } from "react-hook-form";

type ASInputProps = {
  name: string;
  label: string;
  type?: string;
  defaultValue?: any;
  min?: number;
};

const ASInput = ({ name, label, type = "text", defaultValue, min }: ASInputProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        min={min}
        defaultValue={defaultValue}
        {...register(name, { required: `${label} is required` })}
        className="w-full border px-3 py-2 rounded-md"
      />
      {errors[name] && (
        <p className="text-sm text-red-500 mt-1">
          {(errors[name] as any).message}
        </p>
      )}
    </div>
  );
};

export default ASInput;
