import { getLLMConfig, isLLMConfigured } from "~/config/llm.server";
import { checkOllamaConnection } from "~/config/llm-health.server";

/**
 * Performs LLM health check on startup
 * Logs results to console
 */
export async function performLLMStartupCheck(): Promise<void> {
  if (!isLLMConfigured()) {
    console.log("⚠️  LLM is not configured. AI features will be disabled.");
    return;
  }

  const config = getLLMConfig();
  console.log(`✅ LLM Provider: ${config.provider.toUpperCase()}`);

  if (config.provider === "openai") {
    console.log(`   Model: ${config.openai?.model || "N/A"}`);
    console.log(`   API Key: ${config.openai?.apiKey ? "✅ Set" : "❌ Missing"}`);
  } else if (config.provider === "ollama") {
    console.log(`   Base URL: ${config.ollama?.baseUrl || "N/A"}`);
    console.log(`   Model: ${config.ollama?.model || "N/A"}`);
    
    console.log("   Checking Ollama connection...");
    const check = await checkOllamaConnection();
    
    if (check.available) {
      console.log("   ✅ Ollama is accessible and model is available");
    } else {
      console.log(`   ❌ Ollama connection failed: ${check.error}`);
      console.log("   ⚠️  AI features may not work correctly");
    }
  }
}


