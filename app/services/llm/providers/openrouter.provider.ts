import OpenAI from "openai";
import type {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  FormDefinition,
} from "../types";
import { getLLMConfig } from "~/config/llm.server";

/**
 * OpenRouter Provider Implementation
 * Uses OpenAI-compatible API at https://openrouter.ai/api/v1
 */
export class OpenRouterProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    const config = getLLMConfig();
    if (config.provider !== "openrouter" || !config.openrouter) {
      throw new Error("OpenRouter provider requires OpenRouter configuration");
    }

    this.client = new OpenAI({
      apiKey: config.openrouter.apiKey,
      baseURL: "https://openrouter.ai/api/v1",
    });
    this.model = config.openrouter.model;
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    try {
      const systemPrompt =
        request.systemPrompt ||
        this.getDefaultSystemPrompt(request.formDefinition);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: request.message,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const rawText = response.choices[0]?.message?.content || "";

      if (!rawText) {
        throw new Error("Empty response from OpenRouter");
      }

      // Try to parse JSON from response
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawText);
      } catch {
        // If parsing fails, try to extract JSON from markdown code blocks
        const jsonMatch = rawText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          parsedJson = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error("Failed to parse JSON from OpenRouter response");
        }
      }

      return {
        rawText,
        parsedJson,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenRouter API error: ${error.message}`);
      }
      throw new Error("Unknown error occurred while calling OpenRouter API");
    }
  }

  private getDefaultSystemPrompt(formDefinition: FormDefinition): string {
    return `You are an AI assistant that helps edit form definitions. You receive user instructions and must return JSON Patch operations to modify the form.

Current form definition:
${JSON.stringify(formDefinition, null, 2)}

Allowed field types:
- text: single-line text input
  Options: label, placeholder, required, minLength, maxLength
- number: numeric input
  Options: label, placeholder, required, min, max, step
- textarea: multi-line text input
  Options: label, placeholder, required, minLength, maxLength, rows

You must respond with valid JSON only (no markdown, no code blocks). Use one of these formats:

Option A (Recommended - JSON Patch):
{
  "type": "patch",
  "operations": [
    { "op": "add", "path": "/fields/-", "value": { "id": "field-id", "type": "text", "label": "Field Label", "required": false, "order": 0 } },
    { "op": "replace", "path": "/fields/0/required", "value": true },
    { "op": "remove", "path": "/fields/1" }
  ]
}

Option B (Full replacement):
{
  "type": "replace",
  "formDefinition": {
    "fields": [...]
  }
}

JSON Patch operations:
- "add": Add a new field (use "/fields/-" to append)
- "replace": Modify an existing field property
- "remove": Delete a field
- "move": Reorder fields

Important rules:
1. Only use allowed field types (text, number, textarea)
2. Each field must have: id, type, label, required, order
3. Field IDs must be unique strings
4. Order must be sequential integers starting from 0
5. Return valid JSON only, no markdown formatting`;
  }
}
