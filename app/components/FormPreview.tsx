import type { FormFieldData } from "./FormFieldEditor";

interface FormPreviewProps {
  title: string;
  description?: string | null;
  fields: FormFieldData[];
}

export function FormPreview({ title, description, fields }: FormPreviewProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>
        )}

        {fields.length === 0 && (
          <p className="text-gray-400 dark:text-gray-500 italic">
            This form has no fields yet.
          </p>
        )}

        <div className="space-y-5">
          {fields.map((field) => (
            <PreviewField key={field.id} field={field} />
          ))}
        </div>

        {fields.length > 0 && (
          <button
            type="button"
            disabled
            className="mt-8 w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg opacity-60 cursor-not-allowed"
          >
            Submit (preview only)
          </button>
        )}
      </div>
    </div>
  );
}

function PreviewField({ field }: { field: FormFieldData }) {
  const labelEl = (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {field.label}
      {field.required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  const inputClasses =
    "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white";

  switch (field.type) {
    case "text":
      return (
        <div>
          {labelEl}
          <input
            type="text"
            disabled
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            minLength={field.minLength || undefined}
            maxLength={field.maxLength || undefined}
            className={inputClasses}
          />
        </div>
      );

    case "number":
      return (
        <div>
          {labelEl}
          <input
            type="number"
            disabled
            placeholder={field.placeholder || "0"}
            min={field.min || undefined}
            max={field.max || undefined}
            step={field.step || undefined}
            className={inputClasses}
          />
        </div>
      );

    case "textarea":
      return (
        <div>
          {labelEl}
          <textarea
            disabled
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            minLength={field.minLength || undefined}
            maxLength={field.maxLength || undefined}
            rows={field.rows || 4}
            className={inputClasses}
          />
        </div>
      );

    default:
      return null;
  }
}

