/**
 * Form Definition Types
 * Types for representing form structure and JSON Patch operations
 */

import type { FormFieldDefinition, FormDefinition } from "~/services/llm/types";

// Re-export for convenience
export type { FormFieldDefinition, FormDefinition };

/**
 * JSON Patch Operation
 * Based on RFC 6902 JSON Patch specification
 */
export interface JSONPatchOperation {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;
}

/**
 * AI Response - can be either patch operations or full replacement
 */
export type AIResponse =
  | {
      type: "patch";
      operations: JSONPatchOperation[];
    }
  | {
      type: "replace";
      formDefinition: FormDefinition;
    };


