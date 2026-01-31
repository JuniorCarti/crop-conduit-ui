import { useEffect, useRef, useState } from "react";
import { Play, Square, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { speakText } from "@/services/voiceService";
import type { AshaMessage } from "@/types/asha";
import { toast } from "sonner";
import { AshaInsightCard } from "@/components/asha/InsightCard";

type ChatBubbleProps = {
  message: AshaMessage;
};

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function ChatBubble({ message }: ChatBubbleProps) {
  const isAssistant = message.role === "assistant";
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const playAudio = async (forceReload = false) => {
    if (!isAssistant || !message.text.trim()) return;
    if (isLoading) return;

    try {
      setIsLoading(true);
      let url = audioUrl;
      if (!url || forceReload) {
        const blob = await speakText(message.text);
        url = URL.createObjectURL(blob);
        setAudioUrl(url);
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        toast.error("Audio playback failed.");
      };
      await audio.play();
    } catch (error: any) {
      toast.error(error?.message || "Voice playback failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const stopAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  useEffect(() => {
    if (!message.autoPlay || !isAssistant || autoPlayedRef.current) return;
    autoPlayedRef.current = true;
    void playAudio();
  }, [isAssistant, message.autoPlay]);

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        message.role === "user" ? "items-end" : "items-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-card text-foreground border border-border"
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
        {message.cards && message.cards.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.cards.map((card, index) => (
              <AshaInsightCard key={`${message.id}-${index}`} card={card} />
            ))}
          </div>
        )}
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{formatTime(message.createdAt)}</span>
          {message.status === "error" && <span>Failed</span>}
        </div>
      </div>

      {isAssistant && (
        <div className="flex items-center gap-2">
          {isPlaying && <span className="text-xs text-muted-foreground">Playing...</span>}
          {!isPlaying && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => void playAudio(false)}
              disabled={isLoading}
            >
              <Play className="mr-2 h-3 w-3" />
              {isLoading ? "Loading..." : "Play"}
            </Button>
          )}
          {isPlaying && (
            <Button size="sm" variant="outline" onClick={stopAudio}>
              <Square className="mr-2 h-3 w-3" />
              Stop
            </Button>
          )}
          {audioUrl && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void playAudio(true)}
              disabled={isLoading}
            >
              <RefreshCcw className="mr-2 h-3 w-3" />
              Replay
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
