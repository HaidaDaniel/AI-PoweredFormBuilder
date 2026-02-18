import { Form } from "react-router";
import { Modal } from "~/components/ui/Modal";
import { Button } from "~/components/ui/Button";
import type { FormFieldData } from "./types";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  fields: FormFieldData[];
  values: Record<string, unknown>;
  isSubmitting: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  fields,
  values,
  isSubmitting,
}: ConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Submission"
      footer={
        <>
          <Form method="post" className="flex-1">
            <input type="hidden" name="intent" value="confirm" />
            <input
              type="hidden"
              name="valuesJson"
              value={JSON.stringify(values)}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Saving..." : "Confirm"}
            </Button>
          </Form>
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Please review your answers before submitting:
      </p>
      <div className="space-y-3">
        {fields.map((field) => {
          const value = values[field.id];
          return (
            <div
              key={field.id}
              className="border-b border-gray-200 dark:border-gray-700 pb-2"
            >
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {value === null || value === undefined || value === ""
                  ? "(empty)"
                  : String(value)}
              </p>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

