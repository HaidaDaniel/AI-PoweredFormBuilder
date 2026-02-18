import type { LLMProvider, LLMRequest, LLMResponse, FormDefinition } from "../types";
import { getLLMConfig } from "~/config/llm.server";

/**
 * Ollama Provider Implementation
 */
export class OllamaProvider implements LLMProvider {
  private baseUrl: string;
  private model: string;

  constructor() {
    const config = getLLMConfig();
    if (config.provider !== "ollama" || !config.ollama) {
      throw new Error("Ollama provider requires Ollama configuration");
    }

    this.baseUrl = config.ollama.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.model = config.ollama.model;
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    try {
      const systemPrompt =
        request.systemPrompt ||
        this.getDefaultSystemPrompt(request.formDefinition);

      const prompt = `${systemPrompt}\n\nUser instruction: ${request.message}\n\nRespond with JSON only (no markdown, no code blocks):`;

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          format: "json",
          options: {
            temperature: 0.3,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Ollama API error (${response.status}): ${errorText || response.statusText}`
        );
      }

      const data = await response.json();
      const rawText = data.response || "";

      if (!rawText) {
        throw new Error("Empty response from Ollama");
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
          // Try to find JSON object in the text
          const jsonObjectMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonObjectMatch) {
            parsedJson = JSON.parse(jsonObjectMatch[0]);
          } else {
            throw new Error("Failed to parse JSON from Ollama response");
          }
        }
      }

      return {
        rawText,
        parsedJson,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Ollama API error: ${error.message}`);
      }
      throw new Error("Unknown error occurred while calling Ollama API");
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

