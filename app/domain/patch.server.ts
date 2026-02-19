import pkg from "fast-json-patch";
const { applyPatch: applyJsonPatch } = pkg;
import type { Operation } from "fast-json-patch";
import type { FormDefinition, JSONPatchOperation } from "./form.types";
import { FormDefinitionSchema, JSONPatchOperationSchema } from "./ai.schema";

/**
 * Validates JSON Patch operations
 */
export function validatePatch(
  operations: JSONPatchOperation[]
): { valid: boolean; error?: string } {
  try {
    for (const op of operations) {
      // Validate structure
      const result = JSONPatchOperationSchema.safeParse(op);
      if (!result.success) {
        return {
          valid: false,
          error: `Invalid patch operation: ${result.error.message}`,
        };
      }

      // Validate path format
      if (!op.path.startsWith("/")) {
        return {
          valid: false,
          error: `Invalid path: ${op.path}. Path must start with "/"`,
        };
      }

      // Validate operation-specific requirements
      if ((op.op === "add" || op.op === "replace") && op.value === undefined) {
        return {
          valid: false,
          error: `Operation "${op.op}" requires a "value" field`,
        };
      }

      if ((op.op === "move" || op.op === "copy") && !op.from) {
        return {
          valid: false,
          error: `Operation "${op.op}" requires a "from" field`,
        };
      }
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown validation error",
    };
  }
}

/**
 * Applies JSON Patch operations to a form definition
 * @param formDefinition - The current form definition
 * @param operations - Array of JSON Patch operations
 * @returns Updated form definition and validation result
 */
export function applyPatch(
  formDefinition: FormDefinition,
  operations: JSONPatchOperation[]
): {
  success: boolean;
  formDefinition?: FormDefinition;
  error?: string;
} {
  // Validate operations first
  const validation = validatePatch(operations);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  try {
    // Convert to fast-json-patch format
    const patchOperations: Operation[] = operations.map((op): Operation => {
      switch (op.op) {
        case "add":
        case "replace":
        case "test":
          return { op: op.op, path: op.path, value: op.value };
        case "move":
        case "copy":
          return { op: op.op, path: op.path, from: op.from! };
        case "remove":
          return { op: "remove", path: op.path };
        default:
          return { op: op.op, path: op.path } as Operation;
      }
    });

    // Create a deep copy to avoid mutating the original
    const formCopy = JSON.parse(JSON.stringify(formDefinition));

    // Apply patch - use mutateDocument: true so formCopy is modified in place
    const result = applyJsonPatch(formCopy, patchOperations, false, true);

    // Check for errors
    if (result.length > 0 && result[0] && "error" in result[0] && result[0].error) {
      return {
        success: false,
        error: `Patch application error: ${(result[0] as { error?: unknown }).error}`,
      };
    }

    // Validate the result (formCopy was mutated by applyJsonPatch)
    const validationResult = FormDefinitionSchema.safeParse(formCopy);
    if (!validationResult.success) {
      return {
        success: false,
        error: `Result validation failed: ${validationResult.error.message}`,
      };
    }

    return {
      success: true,
      formDefinition: validationResult.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error applying patch",
    };
  }
}

/**
 * Validates that patch operations only target allowed paths
 */
export function validatePatchPaths(operations: JSONPatchOperation[]): {
  valid: boolean;
  error?: string;
} {
  for (const op of operations) {
    // Only allow operations on /fields path
    if (!op.path.startsWith("/fields")) {
      return {
        valid: false,
        error: `Path "${op.path}" is not allowed. Only paths starting with "/fields" are permitted.`,
      };
    }
  }

  return { valid: true };
}

