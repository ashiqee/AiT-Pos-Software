"use client";

import React, { useState } from "react";
import { Button } from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { Trash2 } from "lucide-react";

export default function DeleteAlert({ id ,onProductUpdated}: { id: string,onProductUpdated:any }) {
  const [isOpen, setIsOpen] = useState(false);

  const onConfirmDelete = async () => {
    const response = await fetch(`/api/products/${id}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete product');
  }
  
  setIsOpen(false);
  onProductUpdated?.()
  return response.json();

  };



  return (
    <>
      <Button
        onPress={() => setIsOpen(true)}
        isIconOnly
        size="sm"
        variant="light"
        color="danger"
      >
        <Trash2 size={16} />
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-danger text-lg font-bold">
                Confirm Delete
              </ModalHeader>
              <ModalBody>
                <p>
                  Are you sure you want to delete this item? <br />
                  This action{" "}
                  <span className="font-semibold">cannot be undone</span>.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="danger" onPress={onConfirmDelete}>
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
