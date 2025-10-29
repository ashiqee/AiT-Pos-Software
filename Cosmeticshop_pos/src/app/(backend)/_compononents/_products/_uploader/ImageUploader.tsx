import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";

// ASImageUploader Component
interface ASImageUploaderProps {
  name: string;
  label?: string;
  required?: boolean;
  defaultValue?: string;
  control: any;
  setValue: any;
}

export default function ImageUploader({ name, label, required = false, defaultValue, control, setValue }: ASImageUploaderProps) {
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
    formData.append("upload_preset", "RN_POS");

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
        toast.success('Image uploaded successfully');
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Image upload failed. Please try again.");
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
              {label}
              {required && <span className="text-red-500"> *</span>}
            </label>
          )}

          <div className="flex items-start gap-4">
            {localPreview ? (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                <Image
                  src={localPreview}
                  alt="Product image"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                  title="Remove Image"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                <span className="text-gray-500 text-sm">No image</span>
              </div>
            )}
            
            <div className="flex-1">
              <label
                className={`flex items-center justify-center gap-2 text-sm cursor-pointer border-2 border-dashed rounded-lg px-4 py-3 transition-colors ${
                  uploading 
                    ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50 border-gray-300" 
                    : "border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10"
                }`}
              >
                <Upload size={18} />
                <span>{uploading ? "Uploading..." : "Upload Image"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleImageUpload}
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Upload an image from your device (JPG, PNG, GIF)
              </p>
            </div>
          </div>

          {fieldState.error && (
            <p className="text-sm text-red-500 mt-2">{fieldState.error.message}</p>
          )}
        </div>
      )}
    />
  );
}