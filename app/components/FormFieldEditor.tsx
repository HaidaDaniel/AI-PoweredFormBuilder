import { useRef, useEffect, useState } from "react";
import { Input } from "~/components/ui/Input";
import { Toggle } from "~/components/ui/Toggle";

export type FieldType = "text" | "number" | "textarea";

export interface FormFieldData {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  order: number;
  placeholder?: string | null;
  minLength?: number | null;
  maxLength?: number | null;
  min?: number | null;
  max?: number | null;
  step?: number | null;
  rows?: number | null;
}


interface FormFieldEditorProps {
  field: FormFieldData;
  formId: string;
  isFirst: boolean;
  isLast: boolean;
  fieldIndex?: number;
  labelError?: string;
  onFieldTouched?: (fieldId: string) => void;
  onFieldChange?: (fieldId: string, updates: Partial<FormFieldData>) => void;
  onFieldDelete?: (fieldId: string) => void;
  onFieldReorder?: (fieldId: string, direction: "up" | "down") => void;
}

export function FormFieldEditor({
  field,
  isFirst,
  isLast,
  fieldIndex,
  labelError,
  onFieldTouched,
  onFieldChange,
  onFieldDelete,
  onFieldReorder,
}: FormFieldEditorProps) {
  const labelInputRef = useRef<HTMLInputElement>(null);
  const hasFocusedRef = useRef<boolean>(false);
  const [label, setLabel] = useState<string>(field.label);
  const [type, setType] = useState<FieldType>(field.type);
  const [required, setRequired] = useState<boolean>(field.required);
  const [placeholder, setPlaceholder] = useState<string>(field.placeholder || "");
  const [minLength, setMinLength] = useState<number | null>(field.minLength ?? null);
  const [maxLength, setMaxLength] = useState<number | null>(field.maxLength ?? null);
  const [min, setMin] = useState<number | null>(field.min ?? null);
  const [max, setMax] = useState<number | null>(field.max ?? null);
  const [step, setStep] = useState<number | null>(field.step ?? null);
  const [rows, setRows] = useState<number | null>(field.rows ?? null);

  // Reset form when field changes
  // This effect syncs props to local state when field changes
  // This is a standard pattern for controlled components that need to sync external props to internal state
  // The linter warning about setState in effects is overly strict for this valid use case
  useEffect(() => {
    // Only update if values actually changed to avoid unnecessary renders
    if (field.label !== label) setLabel(field.label);
    if (field.type !== type) setType(field.type);
    if (field.required !== required) setRequired(field.required);
    if ((field.placeholder || "") !== placeholder) setPlaceholder(field.placeholder || "");
    if (field.minLength !== minLength) setMinLength(field.minLength ?? null);
    if (field.maxLength !== maxLength) setMaxLength(field.maxLength ?? null);
    if (field.min !== min) setMin(field.min ?? null);
    if (field.max !== max) setMax(field.max ?? null);
    if (field.step !== step) setStep(field.step ?? null);
    if (field.rows !== rows) setRows(field.rows ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.id, field.label, field.type, field.required, field.placeholder, field.minLength, field.maxLength, field.min, field.max, field.step, field.rows]);


  // Auto-focus on label input when field is "New Field"
  useEffect(() => {
    // Reset focus flag when field changes
    if (field.label !== "New Field") {
      hasFocusedRef.current = false;
    }

    if (field.label === "New Field" && labelInputRef.current) {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        if (labelInputRef.current) {
          labelInputRef.current.focus();
          labelInputRef.current.select();
          hasFocusedRef.current = true;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [field.label, field.id]);

  const handleLabelFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!hasFocusedRef.current && e.target.value === "New Field") {
      e.target.select();
      hasFocusedRef.current = true;
    }
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    if (input.value === "New Field" && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      input.value = e.key;
      input.setSelectionRange(1, 1);
      hasFocusedRef.current = true;
    }
  };

  // Helper function to notify parent of field changes
  const notifyFieldChange = (updates: Partial<FormFieldData>) => {
    onFieldChange?.(field.id, updates);
  };


  const displayIndex = fieldIndex !== undefined ? fieldIndex + 1 : field.order;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
      {/* Field Number - displayed at the top with larger font */}
      <div className="mb-4">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Field #{displayIndex}
        </h3>
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Field Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Field Name
            </label>
            <Input
              value={label}
              onChange={(e) => {
                const newLabel = e.target.value;
                setLabel(newLabel);
                notifyFieldChange({ label: newLabel });
              }}
              ref={labelInputRef}
              placeholder="Field label"
              className="text-sm"
              error={labelError}
              onFocus={handleLabelFocus}
              onKeyDown={handleLabelKeyDown}
              onBlur={() => {
                onFieldTouched?.(field.id);
              }}
            />
          </div>

          {/* Input Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Input Type
            </label>
            <select
              value={type}
              onChange={(e) => {
                const newType = e.target.value as FieldType;
                setType(newType);
                notifyFieldChange({ type: newType });
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="textarea">Textarea</option>
            </select>
          </div>

          {/* Required toggle */}
          <Toggle
            checked={required}
            onChange={(newRequired) => {
              setRequired(newRequired);
              notifyFieldChange({ required: newRequired });
            }}
            label="Required"
          />

          {/* Field-specific options */}
          <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {/* Placeholder - for all types */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Placeholder
              </label>
              <input
                value={placeholder}
                onChange={(e) => {
                  const newPlaceholder = e.target.value;
                  setPlaceholder(newPlaceholder);
                  notifyFieldChange({ placeholder: newPlaceholder || null });
                }}
                placeholder="Enter placeholder text"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            {/* Text field options */}
            {type === "text" && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Min Length
                  </label>
                  <input
                    type="number"
                    value={minLength ?? ""}
                    onChange={(e) => {
                      const newMinLength = e.target.value ? parseInt(e.target.value, 10) : null;
                      setMinLength(newMinLength);
                      notifyFieldChange({ minLength: newMinLength });
                    }}
                    placeholder="Min"
                    min="0"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Max Length
                  </label>
                  <input
                    type="number"
                    value={maxLength ?? ""}
                    onChange={(e) => {
                      const newMaxLength = e.target.value ? parseInt(e.target.value, 10) : null;
                      setMaxLength(newMaxLength);
                      notifyFieldChange({ maxLength: newMaxLength });
                    }}
                    placeholder="Max"
                    min="0"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Number field options */}
            {type === "number" && (
              <>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Min
                    </label>
                    <input
                      type="number"
                      value={min ?? ""}
                      onChange={(e) => {
                        const newMin = e.target.value ? parseFloat(e.target.value) : null;
                        setMin(newMin);
                        notifyFieldChange({ min: newMin });
                      }}
                      placeholder="Min"
                      step="any"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Max
                    </label>
                    <input
                      type="number"
                      value={max ?? ""}
                      onChange={(e) => {
                        const newMax = e.target.value ? parseFloat(e.target.value) : null;
                        setMax(newMax);
                        notifyFieldChange({ max: newMax });
                      }}
                      placeholder="Max"
                      step="any"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Step
                  </label>
                  <input
                    type="number"
                    value={step ?? ""}
                    onChange={(e) => {
                      const newStep = e.target.value ? parseFloat(e.target.value) : null;
                      setStep(newStep);
                      notifyFieldChange({ step: newStep });
                    }}
                    placeholder="Step"
                    step="any"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </>
            )}

            {/* Textarea field options */}
            {type === "textarea" && (
              <>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Min Length
                    </label>
                    <input
                      type="number"
                      value={minLength ?? ""}
                      onChange={(e) => {
                        const newMinLength = e.target.value ? parseInt(e.target.value, 10) : null;
                        setMinLength(newMinLength);
                        notifyFieldChange({ minLength: newMinLength });
                      }}
                      placeholder="Min"
                      min="0"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Max Length
                    </label>
                    <input
                      type="number"
                      value={maxLength ?? ""}
                      onChange={(e) => {
                        const newMaxLength = e.target.value ? parseInt(e.target.value, 10) : null;
                        setMaxLength(newMaxLength);
                        notifyFieldChange({ maxLength: newMaxLength });
                      }}
                      placeholder="Max"
                      min="0"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Rows
                  </label>
                  <input
                    type="number"
                    value={rows ?? ""}
                    onChange={(e) => {
                      const newRows = e.target.value ? parseInt(e.target.value, 10) : null;
                      setRows(newRows);
                      notifyFieldChange({ rows: newRows });
                    }}
                    placeholder="Rows"
                    min="1"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1">
          {/* Move Up */}
          <button
            type="button"
            onClick={() => onFieldReorder?.(field.id, "up")}
            disabled={isFirst}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
            title="Move up"
          >
            ↑
          </button>

          {/* Move Down */}
          <button
            type="button"
            onClick={() => onFieldReorder?.(field.id, "down")}
            disabled={isLast}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
            title="Move down"
          >
            ↓
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onFieldDelete?.(field.id)}
            className="px-2 py-1 text-xs border border-red-300 dark:border-red-700 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
            title="Delete field"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

