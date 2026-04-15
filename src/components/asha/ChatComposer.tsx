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
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      {isRecording && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-medium text-rose-600">Listening... speak now</span>
        </div>
      )}
      {isTranscribing && (
        <div className="mb-3 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Transcribing your voice...
        </div>
      )}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!disabled && value.trim()) onSend();
          }
        }}
        placeholder="Ask Asha anything about your farm, market, or weather..."
        className="min-h-[80px] resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
        disabled={disabled}
      />
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
        <p className="text-[11px] text-muted-foreground">
          {!isVoiceSupported ? "Voice not supported" : "Press Enter to send · Shift+Enter for new line"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={isRecording ? "destructive" : "outline"}
            size="sm"
            onClick={isRecording ? onStop : onMic}
            disabled={!isVoiceSupported}
            className="gap-1.5"
          >
            {isRecording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            {isRecording ? "Stop" : "Voice"}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
