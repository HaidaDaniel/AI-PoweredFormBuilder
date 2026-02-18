import { User, Bot, AlertCircle, Loader2 } from "lucide-react";

export type MessageRole = "user" | "assistant" | "error" | "loading";

interface ChatMessageProps {
  role: MessageRole;
  content: string;
  timestamp?: Date;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === "user";
  const isError = role === "error";
  const isLoading = role === "loading";

  return (
    <div
      className={`flex gap-3 mb-4 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div className="flex-shrink-0">
          {isError ? (
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
          ) : isLoading ? (
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          )}
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? "bg-blue-600 text-white"
            : isError
              ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        }`}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Processing...</span>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
          </div>
        )}
        {timestamp && (
          <p
            className={`text-xs mt-1 ${
              isUser
                ? "text-blue-100"
                : isError
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {timestamp.toLocaleTimeString()}
          </p>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </div>
        </div>
      )}
    </div>
  );
}

