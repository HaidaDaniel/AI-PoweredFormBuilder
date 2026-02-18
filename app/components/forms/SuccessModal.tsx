import { useEffect } from "react";
import { Modal } from "~/components/ui/Modal";
import { Button } from "~/components/ui/Button";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: () => void;
}

export function SuccessModal({
  isOpen,
  onClose,
  onNavigate,
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onNavigate();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onNavigate]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onNavigate} className="w-full">
            Go to Home
          </Button>
        </>
      }
    >
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <svg
              className="h-8 w-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Congratulations!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your form has been submitted successfully!
          </p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Redirecting automatically in 2 seconds...
        </p>
      </div>
    </Modal>
  );
}



