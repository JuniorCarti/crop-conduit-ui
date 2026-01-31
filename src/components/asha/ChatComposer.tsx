import { Mic, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ChatComposer({
  value,
  onChange,
  onSend,
  onMic,
  onStop,
  disabled,
  isRecording,
  isTranscribing,
  isVoiceSupported,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onMic: () => void;
  onStop: () => void;
  disabled?: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
  isVoiceSupported: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ask Asha anything about your farm, market, or weather..."
        className="min-h-[90px] resize-none"
        disabled={disabled}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className={cn("h-2 w-2 rounded-full bg-rose-500", "animate-pulse")} />
                <span className="text-rose-600">Recording</span>
              </div>
            </div>
          )}
          {isTranscribing && <span>Transcribing...</span>}
          {!isVoiceSupported && <span>Voice input not supported</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={isRecording ? "destructive" : "outline"}
            onClick={isRecording ? onStop : onMic}
            disabled={!isVoiceSupported}
          >
            {isRecording ? (
              <Square className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          <Button type="button" onClick={onSend} disabled={disabled || !value.trim()}>
            <Send className="mr-2 h-4 w-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
