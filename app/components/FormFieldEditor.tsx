import { Form } from "react-router";
import { useRef, useEffect } from "react";

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
}

export function FormFieldEditor({
  field,
  formId,
  isFirst,
  isLast,
}: FormFieldEditorProps) {
  const labelInputRef = useRef<HTMLInputElement>(null);
  const hasFocusedRef = useRef<boolean>(false);

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

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Label and Type row */}
          <div className="flex gap-3">
            <Form method="post" className="flex-1" key={`label-${field.id}`}>
              <input type="hidden" name="intent" value="updateField" />
              <input type="hidden" name="fieldId" value={field.id} />
              <input type="hidden" name="type" value={field.type} />
              <input type="hidden" name="required" value={String(field.required)} />
              <input type="hidden" name="placeholder" value={field.placeholder || ""} />
              <input type="hidden" name="minLength" value={field.minLength || ""} />
              <input type="hidden" name="maxLength" value={field.maxLength || ""} />
              <input type="hidden" name="min" value={field.min || ""} />
              <input type="hidden" name="max" value={field.max || ""} />
              <input type="hidden" name="step" value={field.step || ""} />
              <input type="hidden" name="rows" value={field.rows || ""} />
              <div className="flex gap-2">
                <input
                  ref={labelInputRef}
                  name="label"
                  defaultValue={field.label}
                  placeholder="Field label"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  onFocus={handleLabelFocus}
                  onKeyDown={handleLabelKeyDown}
                  onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                />
              </div>
            </Form>

            {/* Type selector */}
            <Form method="post" key={`type-${field.id}`}>
              <input type="hidden" name="intent" value="updateField" />
              <input type="hidden" name="fieldId" value={field.id} />
              <input type="hidden" name="label" value={field.label} />
              <input type="hidden" name="required" value={String(field.required)} />
              <input type="hidden" name="placeholder" value={field.placeholder || ""} />
              <input type="hidden" name="minLength" value={field.minLength || ""} />
              <input type="hidden" name="maxLength" value={field.maxLength || ""} />
              <input type="hidden" name="min" value={field.min || ""} />
              <input type="hidden" name="max" value={field.max || ""} />
              <input type="hidden" name="step" value={field.step || ""} />
              <input type="hidden" name="rows" value={field.rows || ""} />
              <select
                name="type"
                defaultValue={field.type}
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="textarea">Textarea</option>
              </select>
            </Form>
          </div>

          {/* Required toggle */}
          <Form method="post" className="flex items-center gap-2" key={`required-${field.id}`}>
            <input type="hidden" name="intent" value="updateField" />
            <input type="hidden" name="fieldId" value={field.id} />
            <input type="hidden" name="label" value={field.label} />
            <input type="hidden" name="type" value={field.type} />
            <input type="hidden" name="placeholder" value={field.placeholder || ""} />
            <input type="hidden" name="minLength" value={field.minLength || ""} />
            <input type="hidden" name="maxLength" value={field.maxLength || ""} />
            <input type="hidden" name="min" value={field.min || ""} />
            <input type="hidden" name="max" value={field.max || ""} />
            <input type="hidden" name="step" value={field.step || ""} />
            <input type="hidden" name="rows" value={field.rows || ""} />
            <input
              type="checkbox"
              name="required"
              value="true"
              defaultChecked={field.required}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Required</span>
          </Form>

          {/* Field-specific options */}
          <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {/* Placeholder - for all types */}
            <Form method="post" key={`placeholder-${field.id}`}>
              <input type="hidden" name="intent" value="updateField" />
              <input type="hidden" name="fieldId" value={field.id} />
              <input type="hidden" name="label" value={field.label} />
              <input type="hidden" name="type" value={field.type} />
              <input type="hidden" name="required" value={String(field.required)} />
              <input type="hidden" name="minLength" value={field.minLength || ""} />
              <input type="hidden" name="maxLength" value={field.maxLength || ""} />
              <input type="hidden" name="min" value={field.min || ""} />
              <input type="hidden" name="max" value={field.max || ""} />
              <input type="hidden" name="step" value={field.step || ""} />
              <input type="hidden" name="rows" value={field.rows || ""} />
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Placeholder
                </label>
                <input
                  type="text"
                  name="placeholder"
                  defaultValue={field.placeholder || ""}
                  placeholder="Enter placeholder text"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                />
              </div>
            </Form>

            {/* Text field options */}
            {field.type === "text" && (
              <>
                <Form method="post" key={`text-options-${field.id}`}>
                  <input type="hidden" name="intent" value="updateField" />
                  <input type="hidden" name="fieldId" value={field.id} />
                  <input type="hidden" name="label" value={field.label} />
                  <input type="hidden" name="type" value={field.type} />
                  <input type="hidden" name="required" value={String(field.required)} />
                  <input type="hidden" name="placeholder" value={field.placeholder || ""} />
                  <input type="hidden" name="maxLength" value={field.maxLength || ""} />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Min Length
                      </label>
                      <input
                        type="number"
                        name="minLength"
                        defaultValue={field.minLength || ""}
                        placeholder="Min"
                        min="0"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Max Length
                      </label>
                      <input
                        type="number"
                        name="maxLength"
                        defaultValue={field.maxLength || ""}
                        placeholder="Max"
                        min="0"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                      />
                    </div>
                  </div>
                </Form>
              </>
            )}

            {/* Number field options */}
            {field.type === "number" && (
              <>
                <Form method="post" key={`number-minmax-${field.id}`}>
                  <input type="hidden" name="intent" value="updateField" />
                  <input type="hidden" name="fieldId" value={field.id} />
                  <input type="hidden" name="label" value={field.label} />
                  <input type="hidden" name="type" value={field.type} />
                  <input type="hidden" name="required" value={String(field.required)} />
                  <input type="hidden" name="placeholder" value={field.placeholder || ""} />
                  <input type="hidden" name="max" value={field.max || ""} />
                  <input type="hidden" name="step" value={field.step || ""} />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Min
                      </label>
                      <input
                        type="number"
                        name="min"
                        defaultValue={field.min || ""}
                        placeholder="Min"
                        step="any"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Max
                      </label>
                      <input
                        type="number"
                        name="max"
                        defaultValue={field.max || ""}
                        placeholder="Max"
                        step="any"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                      />
                    </div>
                  </div>
                </Form>
                <Form method="post" key={`number-step-${field.id}`}>
                  <input type="hidden" name="intent" value="updateField" />
                  <input type="hidden" name="fieldId" value={field.id} />
                  <input type="hidden" name="label" value={field.label} />
                  <input type="hidden" name="type" value={field.type} />
                  <input type="hidden" name="required" value={String(field.required)} />
                  <input type="hidden" name="placeholder" value={field.placeholder || ""} />
                  <input type="hidden" name="min" value={field.min || ""} />
                  <input type="hidden" name="max" value={field.max || ""} />
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Step
                    </label>
                    <input
                      type="number"
                      name="step"
                      defaultValue={field.step || ""}
                      placeholder="Step"
                      step="any"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                    />
                  </div>
                </Form>
              </>
            )}

            {/* Textarea field options */}
            {field.type === "textarea" && (
              <>
                <Form method="post" key={`textarea-minmax-${field.id}`}>
                  <input type="hidden" name="intent" value="updateField" />
                  <input type="hidden" name="fieldId" value={field.id} />
                  <input type="hidden" name="label" value={field.label} />
                  <input type="hidden" name="type" value={field.type} />
                  <input type="hidden" name="required" value={String(field.required)} />
                  <input type="hidden" name="placeholder" value={field.placeholder || ""} />
                  <input type="hidden" name="maxLength" value={field.maxLength || ""} />
                  <input type="hidden" name="rows" value={field.rows || ""} />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Min Length
                      </label>
                      <input
                        type="number"
                        name="minLength"
                        defaultValue={field.minLength || ""}
                        placeholder="Min"
                        min="0"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Max Length
                      </label>
                      <input
                        type="number"
                        name="maxLength"
                        defaultValue={field.maxLength || ""}
                        placeholder="Max"
                        min="0"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                      />
                    </div>
                  </div>
                </Form>
                <Form method="post" key={`textarea-rows-${field.id}`}>
                  <input type="hidden" name="intent" value="updateField" />
                  <input type="hidden" name="fieldId" value={field.id} />
                  <input type="hidden" name="label" value={field.label} />
                  <input type="hidden" name="type" value={field.type} />
                  <input type="hidden" name="required" value={String(field.required)} />
                  <input type="hidden" name="placeholder" value={field.placeholder || ""} />
                  <input type="hidden" name="minLength" value={field.minLength || ""} />
                  <input type="hidden" name="maxLength" value={field.maxLength || ""} />
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Rows
                    </label>
                    <input
                      type="number"
                      name="rows"
                      defaultValue={field.rows || ""}
                      placeholder="Rows"
                      min="1"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                    />
                  </div>
                </Form>
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1">
          {/* Move Up */}
          <Form method="post" key={`move-up-${field.id}`}>
            <input type="hidden" name="intent" value="reorderField" />
            <input type="hidden" name="fieldId" value={field.id} />
            <input type="hidden" name="direction" value="up" />
            <button
              type="submit"
              disabled={isFirst}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              title="Move up"
            >
              ↑
            </button>
          </Form>

          {/* Move Down */}
          <Form method="post" key={`move-down-${field.id}`}>
            <input type="hidden" name="intent" value="reorderField" />
            <input type="hidden" name="fieldId" value={field.id} />
            <input type="hidden" name="direction" value="down" />
            <button
              type="submit"
              disabled={isLast}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              title="Move down"
            >
              ↓
            </button>
          </Form>

          {/* Delete */}
          <Form method="post" key={`delete-${field.id}`}>
            <input type="hidden" name="intent" value="deleteField" />
            <input type="hidden" name="fieldId" value={field.id} />
            <button
              type="submit"
              className="px-2 py-1 text-xs border border-red-300 dark:border-red-700 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
              title="Delete field"
            >
              ✕
            </button>
          </Form>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        #{field.order} &middot; {field.type}
        {field.required && " · required"}
      </div>
    </div>
  );
}

