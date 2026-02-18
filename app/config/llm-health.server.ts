import { getLLMConfig } from "./llm.server";

/**
 * Checks if Ollama is accessible
 */
export async function checkOllamaConnection(): Promise<{
  available: boolean;
  error?: string;
}> {
  try {
    const config = getLLMConfig();
    
    if (config.provider !== "ollama" || !config.ollama) {
      return { available: false, error: "Ollama is not configured" };
    }

    const baseUrl = config.ollama.baseUrl.replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      return {
        available: false,
        error: `Ollama API returned status ${response.status}`,
      };
    }

    const data = await response.json();
    const modelExists = data.models?.some(
      (m: { name: string }) => m.name === config.ollama!.model
    );

    if (!modelExists) {
      return {
        available: false,
        error: `Model "${config.ollama.model}" not found in Ollama`,
      };
    }

    return { available: true };
  } catch (error) {
    return {
      available: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to connect to Ollama",
    };
  }
}


