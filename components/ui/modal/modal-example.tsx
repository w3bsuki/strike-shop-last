'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from './index';

/**
 * Example usage of the modular modal components
 * This demonstrates how to create custom modals with the new system
 */
export function ModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      <ModalTrigger asChild>
        <Button>Open Modal</Button>
      </ModalTrigger>
      
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>Example Modal</ModalTitle>
          <ModalDescription>
            This is an example of using the modular modal components.
          </ModalDescription>
        </ModalHeader>
        
        <ModalBody className="p-6">
          <p>
            The modal system is built with accessibility in mind and follows the
            Dialog pattern from shadcn/ui. It supports:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2">
            <li>Keyboard navigation (Escape to close)</li>
            <li>Focus management</li>
            <li>Screen reader announcements</li>
            <li>Custom styling with Tailwind classes</li>
            <li>Controlled and uncontrolled modes</li>
          </ul>
        </ModalBody>
        
        <ModalFooter className="p-6 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setIsOpen(false)}>
            Confirm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/**
 * Example of a simple confirmation modal
 */
export function ConfirmationModal({
  isOpen,
  onOpenChange,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <ModalDescription>{description}</ModalDescription>
        </ModalHeader>
        
        <ModalFooter className="p-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Confirm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}