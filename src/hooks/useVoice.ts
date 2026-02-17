import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { speechToText } from "@/services/ashaAzureService";

type UseVoiceOptions = {
  language: "auto" | "en" | "sw";
};

type VoiceRecognitionResult = {
  text: string;
  language?: string;
  confidence?: number;
};

const mapLocaleToShortCode = (locale?: string) => {
  if (!locale) return "en";
  const normalized = locale.toLowerCase();
  if (normalized.startsWith("sw")) return "sw";
  if (normalized.startsWith("en")) return "en";
  return "en";
};

const isMediaSupported = () =>
  typeof window !== "undefined" &&
  Boolean(window.MediaRecorder) &&
  Boolean(navigator.mediaDevices?.getUserMedia);

export function useVoice({ language }: UseVoiceOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState<"en" | "sw">("en");
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isSupported = useMemo(() => isMediaSupported(), []);

  const stopMediaStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopRecorder = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
  }, []);

  const sendToSpeechEndpoint = useCallback(async (blob: Blob): Promise<VoiceRecognitionResult> => {
    const data = (await speechToText(new File([blob], "asha-audio.webm", { type: "audio/webm" }))) as VoiceRecognitionResult;
    if (!data?.text) {
      throw new Error("Voice failed, type your message");
    }
    return data;
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    if (!isSupported) {
      setError("Voice input not supported.");
      return;
    }

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
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (!blob.size) {
          setError("No audio captured.");
          return;
        }

        setIsTranscribing(true);
        try {
          const result = await sendToSpeechEndpoint(blob);
          setTranscript(result.text);
          setDetectedLanguage(
            mapLocaleToShortCode(result.language || (language === "sw" ? "sw" : "en"))
          );
        } catch (err: any) {
          console.error(err);
          setError("Voice failed, type your message");
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.onerror = (event) => {
        console.error("Recorder error", event);
        setError("Voice failed, type your message");
        setIsRecording(false);
        stopMediaStream();
      };

      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error(err);
      setError("Voice failed, type your message");
      stopMediaStream();
    }
  }, [isSupported, language, sendToSpeechEndpoint]);

  const stopRecording = useCallback(() => {
    stopRecorder();
    stopMediaStream();
  }, [stopRecorder, stopMediaStream]);

  useEffect(() => {
    return () => {
      stopRecorder();
      stopMediaStream();
    };
  }, [stopRecorder, stopMediaStream]);

  useEffect(() => {
    if (language === "sw") {
      setDetectedLanguage("sw");
    } else if (language === "en") {
      setDetectedLanguage("en");
    }
  }, [language]);

  return {
    isRecording,
    isTranscribing,
    transcript,
    detectedLanguage,
    setTranscript,
    setDetectedLanguage,
    error,
    isSupported,
    startRecording,
    stopRecording,
  };
}
