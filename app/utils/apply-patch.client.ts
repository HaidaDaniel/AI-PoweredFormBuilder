/**
 * Client-side JSON Patch application
 * Used as fallback when React Router Single Fetch deserializes updatedFields incorrectly
 */
import { applyPatch as applyJsonPatch } from "fast-json-patch";
import type { FormFieldData } from "~/components/FormFieldEditor";

export interface JSONPatchOp {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;
}

/**
 * Applies JSON Patch operations to form fields, returns updated fields
 */
export function applyPatchToFields(
  currentFields: FormFieldData[],
  operations: JSONPatchOp[]
): FormFieldData[] {
  const formDefinition = { fields: currentFields };
  const patchOps = operations.map((op) => {
    const patchOp: { op: string; path: string; value?: unknown; from?: string } = {
      op: op.op,
      path: op.path,
    };
    if (op.value !== undefined) patchOp.value = op.value;
    if (op.from !== undefined) patchOp.from = op.from;
    return patchOp;
  });

  const doc = JSON.parse(JSON.stringify(formDefinition));
  const result = applyJsonPatch(doc, patchOps as Parameters<typeof applyJsonPatch>[1], false, true);

  if (Array.isArray(result) && result[0] && "error" in result[0] && result[0].error) {
    throw new Error(`Patch failed: ${(result[0] as { error?: string }).error}`);
  }

  const fields = doc.fields as Array<Record<string, unknown>>;

  return fields.map((f) => ({
    id: String(f.id ?? ""),
    type: String(f.type ?? "text") as FormFieldData["type"],
    label: String(f.label ?? ""),
    required: Boolean(f.required ?? false),
    order: Number(f.order ?? 0),
    placeholder: f.placeholder != null ? String(f.placeholder) : undefined,
    minLength: f.minLength != null ? Number(f.minLength) : undefined,
    maxLength: f.maxLength != null ? Number(f.maxLength) : undefined,
    min: f.min != null ? Number(f.min) : undefined,
    max: f.max != null ? Number(f.max) : undefined,
    step: f.step != null ? Number(f.step) : undefined,
    rows: f.rows != null ? Number(f.rows) : undefined,
  }));
}

/**
 * Parses rawResponse string from AI to extract patch and apply it
 */
export function applyRawPatchToFields(
  currentFields: FormFieldData[],
  rawResponse: string
): FormFieldData[] | null {
  try {
    const parsed = JSON.parse(rawResponse) as {
      type?: string;
      operations?: JSONPatchOp[];
      formDefinition?: { fields: FormFieldData[] };
    };

    if (parsed.type === "patch" && Array.isArray(parsed.operations)) {
      return applyPatchToFields(currentFields, parsed.operations);
    }
    if (parsed.type === "replace" && parsed.formDefinition?.fields) {
      const raw = parsed.formDefinition.fields;
      return raw.map((f, idx) => ({
        id: String(f.id ?? ""),
        type: String(f.type ?? "text") as FormFieldData["type"],
        label: String(f.label ?? ""),
        required: Boolean(f.required ?? false),
        order: idx,
        placeholder: f.placeholder != null ? String(f.placeholder) : undefined,
        minLength: f.minLength != null ? Number(f.minLength) : undefined,
        maxLength: f.maxLength != null ? Number(f.maxLength) : undefined,
        min: f.min != null ? Number(f.min) : undefined,
        max: f.max != null ? Number(f.max) : undefined,
        step: f.step != null ? Number(f.step) : undefined,
        rows: f.rows != null ? Number(f.rows) : undefined,
      }));
    }
  } catch {
    // ignore parse errors
  }
  return null;
}
