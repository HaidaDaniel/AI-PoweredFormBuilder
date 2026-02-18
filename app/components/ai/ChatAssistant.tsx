import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { ChatMessage, type MessageRole } from "./ChatMessage";
import { VoiceInputButton } from "./VoiceInputButton";

export interface ChatMessageData {
  role: MessageRole;
  content: string;
  timestamp: Date;
}

interface ChatAssistantProps {
  onSendMessage: (message: string) => void | Promise<void>;
  messages: ChatMessageData[];
  isLoading?: boolean;
  error?: string | null;
  disabled?: boolean;
}

export function ChatAssistant({
  onSendMessage,
  messages,
  isLoading = false,
  error = null,
  disabled = false,
}: ChatAssistantProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive (scroll only the messages container, not the page)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || disabled) return;

    const message = inputValue.trim();
    setInputValue("");
    await onSendMessage(message);
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInputValue(transcript);
    // Auto-focus input after voice input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="flex flex-col h-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
      {/* Messages area - with internal scroll */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center min-h-full text-gray-500 dark:text-gray-400">
            <div className="text-center max-w-md px-4">
              <p className="text-sm mb-3 font-medium">
                AI Assistant can modify the form:
              </p>
              <div className="text-xs text-left space-y-2 text-gray-400 dark:text-gray-500">
                <div>
                  <strong className="text-gray-600 dark:text-gray-400">Adding fields:</strong>
                  <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                    <li>"Add a required email field"</li>
                    <li>"Add a phone field"</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-gray-600 dark:text-gray-400">Changing fields:</strong>
                  <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                    <li>"Make the name field required"</li>
                    <li>"Change field label to 'Full Name'"</li>
                    <li>"Set minimum length to 5 characters"</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-gray-600 dark:text-gray-400">Deletion and reordering:</strong>
                  <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                    <li>"Remove the last field"</li>
                    <li>"Move the first field to the end"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
              />
            ))}
            {isLoading && (
              <ChatMessage
                role="loading"
                content="Processing your request..."
                timestamp={new Date()}
              />
            )}
            {error && (
              <ChatMessage
                role="error"
                content={error}
                timestamp={new Date()}
              />
            )}
          </>
        )}
      </div>

      {/* Input area - fixed at bottom */}
      <div className="border-t border-gray-300 dark:border-gray-600 p-4 flex-shrink-0 bg-white dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your instruction or use voice input..."
              disabled={isLoading || disabled}
              className="flex-1"
            />
            <VoiceInputButton
              onTranscript={handleVoiceTranscript}
              disabled={isLoading || disabled}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={!inputValue.trim() || isLoading || disabled}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

