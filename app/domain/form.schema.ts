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
    let fieldSchema: z.ZodString | z.ZodNumber;

    switch (field.type) {
      case "text": {
        let textSchema: z.ZodString = z.string();
        if (field.minLength != null) {
          textSchema = textSchema.min(field.minLength, `Minimum length is ${field.minLength} characters`);
        }
        if (field.maxLength != null) {
          textSchema = textSchema.max(field.maxLength, `Maximum length is ${field.maxLength} characters`);
        }
        fieldSchema = textSchema;
        break;
      }

      case "number": {
        let numberSchema: z.ZodNumber = z.number();
        if (field.min != null) {
          numberSchema = numberSchema.min(field.min, `Minimum value is ${field.min}`);
        }
        if (field.max != null) {
          numberSchema = numberSchema.max(field.max, `Maximum value is ${field.max}`);
        }
        fieldSchema = numberSchema;
        break;
      }

      case "textarea": {
        let textareaSchema: z.ZodString = z.string();
        if (field.minLength != null) {
          textareaSchema = textareaSchema.min(field.minLength, `Minimum length is ${field.minLength} characters`);
        }
        if (field.maxLength != null) {
          textareaSchema = textareaSchema.max(field.maxLength, `Maximum length is ${field.maxLength} characters`);
        }
        fieldSchema = textareaSchema;
        break;
      }

      default:
        // Skip unknown field types
        continue;
    }

    // Apply required constraint
    let finalSchema: z.ZodTypeAny;
    if (field.required) {
      if (field.type === "number") {
        finalSchema = (fieldSchema as z.ZodNumber).refine((val: number) => val != null, "This field is required");
      } else {
        finalSchema = (fieldSchema as z.ZodString).min(1, "This field is required");
      }
    } else {
      finalSchema = fieldSchema.nullable().optional();
    }

    schemaObject[field.id] = finalSchema;
  }

  return z.object(schemaObject);
}

