import { getLLMProvider } from "./llm/provider-factory.server";
import type { FormDefinition } from "./llm/types";
import { AIResponseSchema } from "~/domain/ai.schema";
import { applyPatch, validatePatchPaths } from "~/domain/patch.server";
import type { AIResponse } from "~/domain/form.types";

export interface AIServiceRequest {
  message: string;
  formDefinition: FormDefinition;
}

export interface AIServiceResponse {
  success: boolean;
  formDefinition?: FormDefinition;
  error?: string;
  rawResponse?: string;
}

/**
 * Main AI Service
 * Orchestrates LLM calls, prompt construction, and response validation
 */
export async function processAIRequest(
  request: AIServiceRequest
): Promise<AIServiceResponse> {
  try {
    // Get LLM provider
    const provider = getLLMProvider();

    // Construct system prompt
    const systemPrompt = buildSystemPrompt(request.formDefinition);

    // Call LLM
    const llmResponse = await provider.generate({
      message: request.message,
      formDefinition: request.formDefinition,
      systemPrompt,
    });

    // Log LLM output to terminal for debugging
    console.log("\n--- AI Request: User message ---");
    console.log(request.message);
    console.log("\n--- LLM Raw Response ---");
    console.log(llmResponse.rawText);
    console.log("\n--- LLM Parsed JSON ---");
    console.log(JSON.stringify(llmResponse.parsedJson, null, 2));
    console.log("--- End LLM Output ---\n");

    // Parse and validate response
    const parsedResponse = AIResponseSchema.safeParse(llmResponse.parsedJson);

    if (!parsedResponse.success) {
      return {
        success: false,
        error: `Invalid AI response format: ${parsedResponse.error.message}`,
        rawResponse: llmResponse.rawText,
      };
    }

    const aiResponse: AIResponse = parsedResponse.data;

    // Process based on response type
    if (aiResponse.type === "patch") {
      // Validate patch paths
      const pathValidation = validatePatchPaths(aiResponse.operations);
      if (!pathValidation.valid) {
        return {
          success: false,
          error: pathValidation.error,
          rawResponse: llmResponse.rawText,
        };
      }

      // Apply patch
      const patchResult = applyPatch(
        request.formDefinition,
        aiResponse.operations
      );

      if (!patchResult.success) {
        return {
          success: false,
          error: patchResult.error,
          rawResponse: llmResponse.rawText,
        };
      }

      return {
        success: true,
        formDefinition: patchResult.formDefinition,
        rawResponse: llmResponse.rawText,
      };
    } else {
      // Replace type - validate the new form definition
      const validation = AIResponseSchema.safeParse(aiResponse);
      if (!validation.success) {
        return {
          success: false,
          error: `Invalid form definition in replace response: ${validation.error.message}`,
          rawResponse: llmResponse.rawText,
        };
      }

      return {
        success: true,
        formDefinition: aiResponse.formDefinition,
        rawResponse: llmResponse.rawText,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Builds the system prompt for the LLM
 * Includes full form schema, current editor state as JSON, and strict JSON-only response instructions
 */
function buildSystemPrompt(formDefinition: FormDefinition): string {
  const currentStateJson = JSON.stringify(formDefinition, null, 2);

  return `You are an AI assistant that edits form definitions. You receive the CURRENT form state as JSON and user instructions. You MUST respond with valid JSON ONLY. No HTML, no markdown, no code blocks, no explanatory text.

=== CURRENT EDITOR STATE (JSON) ===
${currentStateJson}
=== END CURRENT STATE ===

=== FORM FIELD SCHEMA (all allowed fields) ===
A form has a "fields" array. Each field has:
- id: string (unique, e.g. "field-1" or UUID)
- type: "text" | "number" | "textarea" (ONLY these three)
- label: string
- required: boolean
- order: number (0-based, sequential)

Optional per type:
- text: placeholder?, minLength?, maxLength?
- number: placeholder?, min?, max?, step?
- textarea: placeholder?, minLength?, maxLength?, rows?

=== RESPONSE FORMAT (JSON ONLY) ===
You must return exactly ONE of these structures. Nothing else.

Option A - JSON Patch (preferred):
{"type":"patch","operations":[{"op":"add","path":"/fields/-","value":{"id":"new-id","type":"text","label":"Label","required":false,"order":0}}]}

Option B - Full replacement:
{"type":"replace","formDefinition":{"fields":[...]}}

Operations: add (path "/fields/-" to append), replace, remove, move.
Index paths: /fields/0 = first field, /fields/1 = second, etc. Use "remove" to delete last: {"op":"remove","path":"/fields/N"} where N is index.

CRITICAL: Respond with raw JSON only. The system parses your response as JSON. Any other output (HTML, markdown, text) will cause an error.`;
}


