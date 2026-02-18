import type { FormFieldData } from "./FormFieldEditor";
import { FormFieldRenderer } from "./forms/FormFieldRenderer";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";

interface FormPreviewProps {
  title: string;
  description?: string | null;
  fields: FormFieldData[];
}

export function FormPreview({ title, description, fields }: FormPreviewProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card variant="elevated" className="p-8">
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
            <FormFieldRenderer
              key={field.id}
              field={field}
              disabled={true}
              mode="preview"
            />
          ))}
        </div>

        {fields.length > 0 && (
          <Button
            type="button"
            disabled
            className="mt-8 w-full opacity-60 cursor-not-allowed"
          >
            Submit (preview only)
          </Button>
        )}
      </Card>
    </div>
  );
}

