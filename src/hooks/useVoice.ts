import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STT_URL = import.meta.env.VITE_ELEVENLABS_STT_URL as string | undefined;
const STT_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined;
const STT_MODEL = import.meta.env.VITE_ELEVENLABS_STT_MODEL as string | undefined;

type SpeechRecognitionConstructor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const supportsSpeechRecognition = (): SpeechRecognitionConstructor | null => {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
};

const canUseElevenLabs = Boolean(STT_URL && STT_API_KEY && typeof MediaRecorder !== "undefined");

async function transcribeWithElevenLabs(blob: Blob): Promise<string> {
  if (!STT_URL || !STT_API_KEY) {
    throw new Error("Speech-to-text service not configured.");
  }

  const formData = new FormData();
  formData.append("file", blob, "asha-audio.webm");
  if (STT_MODEL) {
    formData.append("model_id", STT_MODEL);
  }

  const response = await fetch(STT_URL, {
    method: "POST",
    headers: {
      "xi-api-key": STT_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Speech-to-text failed.");
  }

  const data = await response.json().catch(() => ({}));
  const transcript = data?.text || data?.transcript || data?.content;
  if (!transcript || typeof transcript !== "string") {
    throw new Error("Speech-to-text response missing transcript.");
  }
  return transcript.trim();
}

export function useVoice(language: "en" | "sw") {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionConstructor> | null>(null);

  const isSupported = useMemo(
    () => Boolean(canUseElevenLabs || supportsSpeechRecognition()),
    []
  );

  const stopMediaStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const stopRecognition = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  };

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    stopRecognition();
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript("");

    if (canUseElevenLabs) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        recorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          setIsRecording(false);
          stopMediaStream();
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          if (!blob || blob.size === 0) {
            setError("No audio captured.");
            return;
          }
          setIsTranscribing(true);
          try {
            const text = await transcribeWithElevenLabs(blob);
            setTranscript(text);
          } catch (err: any) {
            setError(err?.message || "Speech-to-text failed.");
          } finally {
            setIsTranscribing(false);
          }
        };

        recorder.start();
        setIsRecording(true);
        return;
      } catch (err: any) {
        setError(err?.message || "Microphone access denied.");
        stopMediaStream();
      }
    }

    const SpeechRecognition = supportsSpeechRecognition();
    if (!SpeechRecognition) {
      setError("Voice input not supported on this browser.");
      return;
    }

    const recognition: InstanceType<SpeechRecognitionConstructor> = new SpeechRecognition();
    recognition.lang = language === "sw" ? "sw-KE" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const results = Array.from(event.results || []);
      const finalTranscript = results
        .map((result: any) => result?.[0]?.transcript)
        .filter(Boolean)
        .join(" ")
        .trim();
      if (finalTranscript) {
        setTranscript(finalTranscript);
      }
    };

    recognition.onerror = () => {
      setError("Voice input failed.");
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.start();
  }, [language]);

  useEffect(() => {
    return () => {
      stopRecording();
      stopMediaStream();
    };
  }, [stopRecording]);

  return {
    isRecording,
    isTranscribing,
    transcript,
    setTranscript,
    error,
    isSupported,
    startRecording,
    stopRecording,
  };
}
