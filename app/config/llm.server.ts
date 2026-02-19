/**
 * LLM Provider Configuration
 * Reads and validates environment variables for LLM provider setup
 */

export type LLMProviderType = "openai" | "ollama" | "openrouter";

export interface LLMConfig {
  provider: LLMProviderType;
  openai?: {
    apiKey: string;
    model: string;
  };
  ollama?: {
    baseUrl: string;
    model: string;
  };
  openrouter?: {
    apiKey: string;
    model: string;
  };
}

/**
 * Validates and returns LLM configuration from environment variables
 * @throws Error if configuration is invalid
 */
export function getLLMConfig(): LLMConfig {
  const provider = (process.env.LLM_PROVIDER || "openai") as LLMProviderType;

  if (provider !== "openai" && provider !== "ollama" && provider !== "openrouter") {
    throw new Error(
      `Invalid LLM_PROVIDER: ${provider}. Must be "openai", "ollama", or "openrouter"`
    );
  }

  const config: LLMConfig = { provider };

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is required when LLM_PROVIDER is set to 'openai'"
      );
    }

    config.openai = {
      apiKey,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
  } else if (provider === "ollama") {
    config.ollama = {
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      model: process.env.OLLAMA_MODEL || "llama3.2",
    };
  } else if (provider === "openrouter") {
    const apiKey =
      process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENROUTER_API_KEY (or OPEN_ROUTER_API_KEY) is required when LLM_PROVIDER is set to 'openrouter'"
      );
    }

    config.openrouter = {
      apiKey,
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
    };
  }

  return config;
}

/**
 * Checks if LLM is configured and available
 */
export function isLLMConfigured(): boolean {
  try {
    getLLMConfig();
    return true;
  } catch {
    return false;
  }
}


