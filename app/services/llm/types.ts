/**
 * LLM Provider Types and Interfaces
 */

export interface LLMRequest {
  message: string;
  formDefinition: FormDefinition;
  systemPrompt?: string;
}

export interface LLMResponse {
  rawText: string;
  parsedJson?: unknown;
}

export interface LLMProvider {
  /**
   * Generate a response from the LLM
   * @param request - The LLM request containing message and form definition
   * @returns Promise resolving to the LLM response
   */
  generate(request: LLMRequest): Promise<LLMResponse>;
}

/**
 * Form field definition matching the database schema
 */
export interface FormFieldDefinition {
  id: string;
  type: "text" | "number" | "textarea";
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

/**
 * Complete form definition structure
 */
export interface FormDefinition {
  fields: FormFieldDefinition[];
}


