import { Mic, MicOff } from "lucide-react";
import { useSpeechRecognition } from "~/hooks/useSpeechRecognition";
import { Button } from "~/components/ui/Button";

interface VoiceInputButtonProps {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceInputButton({
  onTranscript,
  disabled = false,
  className = "",
}: VoiceInputButtonProps) {
  const {
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    transcript,
  } = useSpeechRecognition({
    onResult: onTranscript,
  });

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div
        className={`text-xs text-gray-500 dark:text-gray-400 ${className}`}
        title="Speech recognition is not supported in this browser"
      >
        <MicOff className="w-4 h-4" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        type="button"
        variant="secondary"
        onClick={handleClick}
        disabled={disabled}
        className={`p-2 ${isListening ? "animate-pulse" : ""}`}
        title={isListening ? "Stop recording" : "Start voice input"}
      >
        {isListening ? (
          <Mic className="w-4 h-4 text-red-600 dark:text-red-400" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </Button>
      {error && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-600 dark:text-red-400 whitespace-nowrap z-10 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
          {error}
        </div>
      )}
      {isListening && (
        <div className="absolute top-full left-0 mt-1 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap z-10 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
          Listening...
        </div>
      )}
    </div>
  );
}


