# AI Integration Documentation

## Overview

The AI chat assistant allows admins to edit form fields using natural language instructions. The system supports OpenAI, Ollama, and OpenRouter providers, configured through environment variables.

## Features

- **Natural Language Form Editing**: Describe changes in plain English
- **Voice Input**: Use microphone for hands-free input (Web Speech API)
- **Multiple LLM Providers**: Switch between OpenAI, Ollama, and OpenRouter
- **Safe Updates**: All changes are validated before applying
- **JSON Patch Operations**: Efficient updates using JSON Patch format

## Setup

### Environment Variables

Add the following variables to your `.env` file:

```env
# LLM Provider Configuration
LLM_PROVIDER=openai  # or "ollama" or "openrouter"

# OpenAI Configuration (if using OpenAI)
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o-mini

# Ollama Configuration (if using Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# OpenRouter Configuration (if using OpenRouter)
OPENROUTER_API_KEY=sk-or-your-api-key-here
OPENROUTER_MODEL=openai/gpt-4o-mini
```

### OpenAI Setup

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Set `LLM_PROVIDER=openai`
3. Set `OPENAI_API_KEY` to your API key
4. Optionally set `OPENAI_MODEL` (default: `gpt-4o-mini`)

### Ollama Setup

1. Install [Ollama](https://ollama.ai/)
2. Pull a model: `ollama pull llama3.2`
3. Set `LLM_PROVIDER=ollama`
4. Optionally set `OLLAMA_BASE_URL` (default: `http://localhost:11434`)
5. Optionally set `OLLAMA_MODEL` (default: `llama3.2`)

### OpenRouter Setup

1. Get an API key from [OpenRouter](https://openrouter.ai/keys)
2. Set `LLM_PROVIDER=openrouter`
3. Set `OPENROUTER_API_KEY` (or `OPEN_ROUTER_API_KEY`) to your API key
4. Optionally set `OPENROUTER_MODEL` (default: `openai/gpt-4o-mini`). Use OpenRouter model IDs such as `anthropic/claude-3-haiku`, `google/gemini-flash-1.5`, etc.

## Usage

### Accessing the AI Assistant

1. Navigate to the form editor (`/admin/forms/:id`)
2. Click the "AI Assistant" tab in the right sidebar
3. Start typing or use the microphone button for voice input

### Example Instructions

- "Add a required email field"
- "Make the name field required"
- "Add a textarea for comments with max length 500"
- "Remove the phone field"
- "Add a number field for age with min 18 and max 100"

### Voice Input

1. Click the microphone button
2. Speak your instruction
3. The transcribed text will appear in the input field
4. Edit if needed, then send

**Browser Support:**
- ✅ Chrome/Edge: Full support
- ✅ Safari: Partial support
- ❌ Firefox: Not supported

## How It Works

### Architecture

```
User Input → AI Service → LLM Provider → JSON Patch → Validation → Database
```

1. **User sends message**: Text or voice input
2. **AI Service processes**: Constructs prompt with current form definition
3. **LLM generates response**: Returns JSON Patch operations or full replacement
4. **Validation**: Zod schemas validate the response
5. **Application**: Changes are applied to the form
6. **Database update**: Form fields are updated in the database

### Response Format

The AI can return two types of responses:

**Option A - JSON Patch (Recommended):**
```json
{
  "type": "patch",
  "operations": [
    { "op": "add", "path": "/fields/-", "value": { ... } },
    { "op": "replace", "path": "/fields/0/required", "value": true }
  ]
}
```

**Option B - Full Replacement:**
```json
{
  "type": "replace",
  "formDefinition": {
    "fields": [...]
  }
}
```

### Field Types

The AI understands three field types:

- **text**: Single-line text input
  - Options: `label`, `placeholder`, `required`, `minLength`, `maxLength`
- **number**: Numeric input
  - Options: `label`, `placeholder`, `required`, `min`, `max`, `step`
- **textarea**: Multi-line text input
  - Options: `label`, `placeholder`, `required`, `minLength`, `maxLength`, `rows`

## Troubleshooting

### AI Chat Not Available

**Problem**: "AI chat is not configured" error

**Solution**: 
- Check that `LLM_PROVIDER` is set correctly
- For OpenAI: Ensure `OPENAI_API_KEY` is set
- For Ollama: Ensure Ollama is running and accessible
- For OpenRouter: Ensure `OPENROUTER_API_KEY` (or `OPEN_ROUTER_API_KEY`) is set

### Voice Input Not Working

**Problem**: Microphone button doesn't work

**Solution**:
- Check browser compatibility (Chrome/Edge recommended)
- Grant microphone permissions when prompted
- Ensure you're using HTTPS (required for microphone access)

### Invalid Response from AI

**Problem**: "Invalid AI response format" error

**Solution**:
- The AI may have returned invalid JSON
- Try rephrasing your instruction
- Check the raw response in the error message

### Ollama Connection Error

**Problem**: "Ollama API error" when using Ollama

**Solution**:
- Ensure Ollama is running: `ollama serve`
- Check `OLLAMA_BASE_URL` is correct
- Verify the model exists: `ollama list`

## Security Considerations

- API keys are never exposed to the client
- All AI responses are validated before applying
- Only allowed field types can be created
- Form ownership is verified before updates

## Development

### Adding a New LLM Provider

1. Create provider class in `app/services/llm/providers/`
2. Implement `LLMProvider` interface
3. Add to `provider-factory.server.ts`
4. Update `llm.server.ts` config

### Testing

The system includes validation at multiple levels:
- Zod schemas for response validation
- JSON Patch path validation
- Form definition validation

Test with various instructions to ensure robustness.

## API Reference

### `processAIRequest(request: AIServiceRequest): Promise<AIServiceResponse>`

Main service function that processes AI requests.

**Parameters:**
- `message`: User's instruction
- `formDefinition`: Current form structure

**Returns:**
- `success`: Whether the request succeeded
- `formDefinition`: Updated form definition (if successful)
- `error`: Error message (if failed)
- `rawResponse`: Raw LLM response

### `useSpeechRecognition(options?)`

React hook for voice input.

**Returns:**
- `transcript`: Current transcribed text
- `isListening`: Whether recording is active
- `isSupported`: Browser support status
- `error`: Error message if any
- `startListening()`: Start recording
- `stopListening()`: Stop recording
- `resetTranscript()`: Clear transcript


