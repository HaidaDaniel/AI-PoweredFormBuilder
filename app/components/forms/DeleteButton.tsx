import { Form } from "react-router";
import { useRef, useEffect, useState } from "react";
import { Button } from "~/components/ui/Button";

interface DeleteButtonProps {
  formId: string;
  formTitle: string;
}

export function DeleteButton({ formId, formTitle }: DeleteButtonProps) {
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPopover(false);
      }
    }

    if (showPopover) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showPopover]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setShowPopover(!showPopover)}
        className="px-3 py-1.5 text-sm border border-red-300 dark:border-red-700 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
      >
        Delete
      </button>

      {showPopover && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4"
        >
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Are you sure you want to delete &quot;{formTitle}&quot;? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowPopover(false)}
              className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              Cancel
            </button>
            <Form 
              method="post"
              action="/admin/forms/manage"
              onSubmit={() => {
                setShowPopover(false);
              }}
            >
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="formId" value={formId} />
              <Button
                type="submit"
                variant="danger"
                className="px-3 py-1.5 text-sm"
              >
                Delete
              </Button>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}

