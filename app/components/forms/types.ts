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



