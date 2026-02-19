import { getLLMConfig } from "~/config/llm.server";
import type { LLMProvider } from "./types";
import { OpenAIProvider } from "./providers/openai.provider";
import { OllamaProvider } from "./providers/ollama.provider";
import { OpenRouterProvider } from "./providers/openrouter.provider";

let providerInstance: LLMProvider | null = null;

/**
 * Factory function to get or create the LLM provider instance
 * Uses singleton pattern to ensure only one instance exists
 */
export function getLLMProvider(): LLMProvider {
  if (providerInstance) {
    return providerInstance;
  }

  const config = getLLMConfig();

  switch (config.provider) {
    case "openai":
      providerInstance = new OpenAIProvider();
      break;
    case "ollama":
      providerInstance = new OllamaProvider();
      break;
    case "openrouter":
      providerInstance = new OpenRouterProvider();
      break;
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }

  return providerInstance;
}

/**
 * Reset the provider instance (useful for testing)
 */
export function resetLLMProvider(): void {
  providerInstance = null;
}


