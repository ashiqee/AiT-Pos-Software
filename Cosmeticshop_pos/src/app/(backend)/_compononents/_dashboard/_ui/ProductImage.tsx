'use client';

import { useState } from 'react';
import Image from 'next/image';

import { Search, Image as ImageIcon } from 'lucide-react';
import { useDisclosure } from '@heroui/react';
import ImageModal from './ImageModal';

interface ProductImageProps {
  imageUrl?: string;
  alt: string;
  title?: string;
  className?: string;
  imageClassName?: string;
}

export default function ProductImage({ 
  imageUrl, 
  alt, 
  title, 
  className = "bg-gray-200 rounded-lg w-44 h-44 flex items-center justify-center relative overflow-hidden",
  imageClassName = "w-44 h-44 rounded-md object-cover"
}: ProductImageProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <div 
      role='button'
        className={className}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={imageUrl ? onOpen : undefined}
        style={imageUrl ? { cursor: 'pointer' } : undefined}
      >
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={alt}
              width={400}
              height={400}
              className={imageClassName}
            />
            {isHovered && (
              <div className="absolute inset-0 bg-black/5 bg-opacity-50 flex items-center justify-center">
                <Search className="text-white" size={32} />
              </div>
            )}
          </>
        ) : (
          <ImageIcon size={24} className="text-gray-500" />
        )}
      </div>

      <ImageModal
        isOpen={isOpen}
        onClose={onClose}
        imageUrl={imageUrl}
        alt={alt}
        title={title}
      />
    </>
  );
}