'use client';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from '@heroui/react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  alt: string;
  title?: string;
}

export default function ImageModal({ isOpen, onClose, imageUrl, alt, title }: ImageModalProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
      className="image-modal"
    >
      <ModalContent className="p-0">
        <ModalHeader className="flex justify-between items-center p-4">
          <h3 className="text-xl font-semibold">{title || 'Image Preview'}</h3>
          <Button
            isIconOnly
            variant="light"
            onPress={onClose}
          >
            <X size={20} />
          </Button>
        </ModalHeader>
        <ModalBody className="p-0">
          <div className="flex items-center justify-center bg-black/5 min-h-[400px]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={alt}
                width={800}
                height={600}
                className="max-w-full max-h-[80vh] object-contain"
                priority
              />
            ) : (
              <div className="text-center text-gray-400">
                <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X size={48} />
                </div>
                <p>No image available</p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter className="p-4">
          <Button color="primary" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}