import { forwardRef } from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked, onChange, disabled = false, label, className = "" }, ref) => {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => !disabled && onChange(!checked)}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            ${checked 
              ? "bg-blue-600 dark:bg-blue-500" 
              : "bg-gray-200 dark:bg-gray-700"
            }
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${checked ? "translate-x-6" : "translate-x-1"}
            `}
          />
        </button>
        {label && (
          <label className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer" onClick={() => !disabled && onChange(!checked)}>
            {label}
          </label>
        )}
      </div>
    );
  }
);

Toggle.displayName = "Toggle";



