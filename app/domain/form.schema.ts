import { z } from "zod";
import type { FormField } from "@prisma/client";

/**
 * Generates a Zod schema dynamically from form fields
 * @param fields Array of form fields from the database
 * @returns Zod object schema with field IDs as keys
 */
export function generateFormSchema(fields: FormField[]) {
  const schemaObject: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case "text":
        fieldSchema = z.string();
        if (field.minLength != null) {
          fieldSchema = fieldSchema.min(field.minLength, {
            message: `Minimum length is ${field.minLength} characters`,
          });
        }
        if (field.maxLength != null) {
          fieldSchema = fieldSchema.max(field.maxLength, {
            message: `Maximum length is ${field.maxLength} characters`,
          });
        }
        break;

      case "number":
        fieldSchema = z.number({
          required_error: "This field is required",
          invalid_type_error: "Must be a number",
        });
        if (field.min != null) {
          fieldSchema = fieldSchema.min(field.min, {
            message: `Minimum value is ${field.min}`,
          });
        }
        if (field.max != null) {
          fieldSchema = fieldSchema.max(field.max, {
            message: `Maximum value is ${field.max}`,
          });
        }
        break;

      case "textarea":
        fieldSchema = z.string();
        if (field.minLength != null) {
          fieldSchema = fieldSchema.min(field.minLength, {
            message: `Minimum length is ${field.minLength} characters`,
          });
        }
        if (field.maxLength != null) {
          fieldSchema = fieldSchema.max(field.maxLength, {
            message: `Maximum length is ${field.maxLength} characters`,
          });
        }
        break;

      default:
        // Skip unknown field types
        continue;
    }

    // Apply required constraint
    if (field.required) {
      if (field.type === "number") {
        // For numbers, use refine to check if value is provided
        fieldSchema = fieldSchema.refine((val) => val != null, {
          message: "This field is required",
        });
      } else {
        // For strings (text, textarea), use min(1) to ensure non-empty
        fieldSchema = fieldSchema.min(1, {
          message: "This field is required",
        });
      }
    } else {
      // Optional fields can be null or undefined
      if (field.type === "number") {
        fieldSchema = fieldSchema.nullable().optional();
      } else {
        fieldSchema = fieldSchema.nullable().optional();
      }
    }

    schemaObject[field.id] = fieldSchema;
  }

  return z.object(schemaObject);
}

