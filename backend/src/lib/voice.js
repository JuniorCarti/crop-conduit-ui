const { spawn } = require("child_process");
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const ffmpegPath = require("ffmpeg-static");

const LANGUAGE_CODES = {
  en: "en-US",
  sw: "sw-KE",
};

const AUTO_LANGUAGES = Object.values(LANGUAGE_CODES);

const OUTPUT_FORMATS = {
  mp3: sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3,
  wav: sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm,
};

const DEFAULT_VOICES = {
  en: "en-US-JennyNeural",
  sw: "sw-KE-Neural",
};

async function convertToWav(buffer) {
  if (!ffmpegPath) {
    const error = new Error("FFmpeg binary is not available.");
    error.code = "FFMPEG";
    error.statusCode = 500;
    throw error;
  }

  return new Promise((resolve, reject) => {
    const args = ["-i", "pipe:0", "-ar", "16000", "-ac", "1", "-f", "wav", "pipe:1"];
    const proc = spawn(ffmpegPath, args, { stdio: ["pipe", "pipe", "pipe"] });
    const chunks = [];
    let stderr = "";
    let exitCode = null;

    proc.stdout.on("data", (chunk) => chunks.push(chunk));
    proc.stderr.on("data", (chunk) => (stderr += chunk.toString() || ""));
    proc.on("error", reject);
    proc.on("close", (code) => {
      exitCode = code;
      if (code !== 0) {
        const error = new Error(`FFmpeg conversion failed: ${stderr || "unknown error"}`);
        error.code = "FFMPEG";
        error.statusCode = 500;
        error.exitCode = code;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve({ buffer: Buffer.concat(chunks), exitCode, stderr });
    });

    proc.stdin.on("error", (error) => {
      reject(error);
    });
    proc.stdin.end(buffer);
  });
}

async function prepareAudioBuffer(buffer, contentType) {
  const normalized = (contentType || "").toLowerCase();
  if (normalized.includes("wav")) {
    return {
      buffer,
      conversion: { invoked: false, exitCode: null },
    };
  }

  const result = await convertToWav(buffer);
  return {
    buffer: result.buffer,
    conversion: { invoked: true, exitCode: result.exitCode, stderr: result.stderr },
  };
}

function mapLocaleToShortCode(locale) {
  if (!locale) return "en";
  const normalized = locale.toLowerCase();
  if (normalized.startsWith("sw")) return "sw";
  if (normalized.startsWith("en")) return "en";
  return "en";
}

function getSpeechConfig(key, region) {
  const config = sdk.SpeechConfig.fromSubscription(key, region);
  config.speechRecognitionLanguage = LANGUAGE_CODES.en;
  return config;
}

async function transcribeAudio({
  buffer,
  language = "en",
  speechKey,
  speechRegion,
  contentType,
}) {
  if (!buffer || !buffer.length) {
    throw new Error("Audio data is required.");
  }

  const processed = await prepareAudioBuffer(buffer, contentType);
  const pushStream = sdk.AudioInputStream.createPushStream();
  pushStream.write(processed.buffer);
  pushStream.close();

  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
  const speechConfig = getSpeechConfig(speechKey, speechRegion);
  const isAuto = language === "auto";

  let recognizer;
  if (isAuto) {
    const autoConfig = sdk.AutoDetectSourceLanguageConfig.fromLanguages(AUTO_LANGUAGES);
    recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig, autoConfig);
  } else {
    speechConfig.speechRecognitionLanguage =
      LANGUAGE_CODES[language] ?? LANGUAGE_CODES.en;
    recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
  }

  return new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      (result) => {
        recognizer.close();

        if (
          result.reason === sdk.ResultReason.NoMatch ||
          result.reason === sdk.ResultReason.Canceled
        ) {
          const error = new Error("No speech could be recognized.");
          error.statusCode = 400;
          reject(error);
          return;
        }

        if (!result.text) {
          const error = new Error("Speech recognition returned an empty transcript.");
          error.statusCode = 400;
          reject(error);
          return;
        }

        const locale = result.language || LANGUAGE_CODES[language] || LANGUAGE_CODES.en;
        resolve({
          text: result.text.trim(),
          language: locale,
          confidence: result.confidence ?? 0,
          conversion: processed.conversion,
        });
      },
      (err) => {
        recognizer.close();
        reject(err);
      }
    );
  });
}

async function synthesizeSpeech({
  text,
  voice,
  format = "mp3",
  language = "en",
  speechKey,
  speechRegion,
}) {
  if (!text || !text.trim()) {
    throw new Error("Text is required for speech synthesis.");
  }

  const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
  speechConfig.speechSynthesisVoiceName =
    voice || DEFAULT_VOICES[language] || DEFAULT_VOICES.en;
  speechConfig.speechSynthesisOutputFormat =
    OUTPUT_FORMATS[format] ?? OUTPUT_FORMATS.mp3;

  const audioStream = sdk.AudioOutputStream.createPullStream();
  const audioConfig = sdk.AudioConfig.fromStreamOutput(audioStream);
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      (result) => {
        synthesizer.close();
        if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) {
          reject(new Error("Speech synthesis did not complete."));
          return;
        }

        const contentType = format === "wav" ? "audio/wav" : "audio/mpeg";
        resolve({ buffer: Buffer.from(result.audioData), contentType });
      },
      (err) => {
        synthesizer.close();
        reject(err);
      }
    );
  });
}

module.exports = {
  transcribeAudio,
  synthesizeSpeech,
  mapLocaleToShortCode,
};
