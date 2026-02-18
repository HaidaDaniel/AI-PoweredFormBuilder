import { z } from "zod";

/**
 * Zod schemas for AI responses and validation
 */

// Field type enum
const FieldTypeSchema = z.enum(["text", "number", "textarea"]);

// Form field definition schema
export const FormFieldDefinitionSchema = z.object({
  id: z.string().min(1),
  type: FieldTypeSchema,
  label: z.string().min(1),
  required: z.boolean(),
  order: z.number().int().min(0),
  placeholder: z.string().nullable().optional(),
  minLength: z.number().int().positive().nullable().optional(),
  maxLength: z.number().int().positive().nullable().optional(),
  min: z.number().nullable().optional(),
  max: z.number().nullable().optional(),
  step: z.number().nullable().optional(),
  rows: z.number().int().positive().nullable().optional(),
});

// Form definition schema
export const FormDefinitionSchema = z.object({
  fields: z.array(FormFieldDefinitionSchema),
});

// JSON Patch operation schema
export const JSONPatchOperationSchema = z.object({
  op: z.enum(["add", "remove", "replace", "move", "copy", "test"]),
  path: z.string().min(1),
  value: z.unknown().optional(),
  from: z.string().optional(),
});

// AI Response schema - patch type
export const AIPatchResponseSchema = z.object({
  type: z.literal("patch"),
  operations: z.array(JSONPatchOperationSchema).min(1),
});

// AI Response schema - replace type
export const AIReplaceResponseSchema = z.object({
  type: z.literal("replace"),
  formDefinition: FormDefinitionSchema,
});

// Union schema for AI response
export const AIResponseSchema = z.discriminatedUnion("type", [
  AIPatchResponseSchema,
  AIReplaceResponseSchema,
]);

// Type exports
export type FormFieldDefinition = z.infer<typeof FormFieldDefinitionSchema>;
export type FormDefinition = z.infer<typeof FormDefinitionSchema>;
export type JSONPatchOperation = z.infer<typeof JSONPatchOperationSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;


