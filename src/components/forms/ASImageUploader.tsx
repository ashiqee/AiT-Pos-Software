"use client";

import { useState, useEffect } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { UploadCloud, Trash2 } from "lucide-react";

type Props = {
  name: string;
  label?: string;
  required?: boolean;
  defaultValue?: string;
};

export default function ASImageUploader({ name, label, required = false, defaultValue }: Props) {
  const { control, setValue } = useFormContext();
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(defaultValue ?? null);

  useEffect(() => {
    if (defaultValue) {
      setValue(name, defaultValue, { shouldValidate: true });
    }
  }, [defaultValue, name, setValue]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "asbar_upload"); // 🔁 Change to your Cloudinary preset

    setUploading(true);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.secure_url) {
        setValue(name, data.secure_url, { shouldValidate: true });
        setLocalPreview(data.secure_url);
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setValue(name, "", { shouldValidate: true });
    setLocalPreview(null);
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required ? "Image is required" : false }}
      render={({ field, fieldState }) => (
        <div className="w-full">
          {label && (
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">
              {label}
              {required && <span className="text-red-500"> *</span>}
            </label>
          )}

          {localPreview && (
            <div className="mb-2 relative w-fit">
              <img
                src={localPreview}
                alt="Uploaded"
                className="h-32 w-auto rounded border shadow"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                title="Remove Image"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}

          <label
            className={`flex items-center gap-2 text-sm cursor-pointer border px-3 py-2 rounded-md transition ${
              uploading ? "bg-gray-100 cursor-not-allowed opacity-50" : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <UploadCloud size={16} />
            <span>{uploading ? "Uploading..." : "Upload Image"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={handleImageUpload}
            />
          </label>

          {fieldState.error && (
            <p className="text-sm text-red-500 mt-1">{fieldState.error.message}</p>
          )}
        </div>
      )}
    />
  );
}
