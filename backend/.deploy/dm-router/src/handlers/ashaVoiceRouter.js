const AWS = require("aws-sdk");
let Busboy;
try {
  Busboy = require("busboy");
} catch (error) {
  Busboy = null;
}
const {
  badRequest,
  ok,
  preflightResponse,
  isOptionsRequest,
  requireEnv,
  unauthorized,
  tooManyRequests,
  jsonResponse,
  serverError,
} = require("../lib/response");
const { handleError } = require("../lib/errors");
const { requireAuth } = require("../middleware/auth");
const { enforceRateLimit } = require("../lib/voiceRateLimiter");
const {
  transcribeAudio,
  synthesizeSpeech,
  mapLocaleToShortCode,
} = require("../lib/voice");
const { parseJsonBody } = require("../lib/validation");

const secretsClient = new AWS.SecretsManager();
let cachedAzureSecret = null;
let cachedSecretArn = null;

async function getAzureSpeechCredentials() {
  const secretArn = requireEnv("AZURE_SPEECH_SECRET_ARN");
  if (cachedAzureSecret && cachedSecretArn === secretArn) {
    return cachedAzureSecret;
  }

  const result = await secretsClient
    .getSecretValue({ SecretId: secretArn })
    .promise();
  if (!result || !result.SecretString) {
    const error = new Error("Azure speech secret is missing in Secrets Manager.");
    error.statusCode = 500;
    throw error;
  }

  let parsed;
  try {
    parsed = JSON.parse(result.SecretString);
  } catch (err) {
    const error = new Error("Azure speech secret is not valid JSON.");
    error.statusCode = 500;
    error.cause = err;
    throw error;
  }

  const speechKey = parsed.AZURE_SPEECH_KEY;
  const speechRegion = parsed.AZURE_SPEECH_REGION;
  if (!speechKey || !speechRegion) {
    const error = new Error("Azure Speech not configured");
    error.statusCode = 500;
    throw error;
  }

  cachedAzureSecret = { speechKey, speechRegion };
  cachedSecretArn = secretArn;
  return cachedAzureSecret;
}

function logVoiceEvent({ route, uid, latencyMs, language, status, errorCode }) {
  console.info(
    JSON.stringify({
      event: "ashaVoice",
      route,
      uid: uid || null,
      latencyMs,
      language,
      status,
      errorCode: errorCode || null,
      timestamp: new Date().toISOString(),
    })
  );
}

function logSttDiagnostics(payload) {
  console.info(
    JSON.stringify({
      event: "ashaVoiceSttDiagnostics",
      timestamp: new Date().toISOString(),
      ...payload,
    })
  );
}

async function parseMultipart(event) {
  const headers = event?.headers || {};
  const contentType =
    headers["content-type"] ||
    headers["Content-Type"] ||
    headers["contentType"] ||
    "";

  if (!contentType) {
    const error = new Error("Missing content-type header for audio upload.");
    error.statusCode = 400;
    throw error;
  }
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    const error = new Error("Expected multipart/form-data upload.");
    error.statusCode = 400;
    throw error;
  }
  if (typeof Busboy !== "function") {
    const error = new Error("Busboy dependency missing");
    error.statusCode = 500;
    throw error;
  }

  const buffer = event.body
    ? Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8")
    : Buffer.alloc(0);

  return new Promise((resolve, reject) => {
    const busboy = new Busboy({ headers: { "content-type": contentType } });
    const fields = {};
    const files = [];

    busboy.on("field", (fieldname, value) => {
      fields[fieldname] = value;
    });

    busboy.on("file", (fieldname, fileStream, filename, encoding, mimetype) => {
      const chunks = [];
      fileStream.on("data", (chunk) => {
        chunks.push(chunk);
      });

      fileStream.on("end", () => {
        files.push({
          fieldname,
          filename,
          contentType: mimetype || "application/octet-stream",
          buffer: Buffer.concat(chunks),
        });
      });

      fileStream.on("error", reject);
    });

    busboy.on("error", reject);

    busboy.on("finish", () => {
      resolve({ fields, files });
    });

    busboy.end(buffer);
  });
}

function getPath(event) {
  return (
    event?.requestContext?.http?.path ||
    event?.path ||
    event?.rawPath ||
    ""
  );
}

function normalizeLanguage(value) {
  if (!value) return "en";
  const lowered = value.toLowerCase();
  if (lowered === "auto" || lowered === "autodetect") {
    return "auto";
  }
  if (lowered.startsWith("sw")) {
    return "sw";
  }
  if (lowered.startsWith("en")) {
    return "en";
  }
  return "en";
}

function resolveSttLanguage(event, fields = {}) {
  const headerLanguage =
    event?.headers?.["x-language"] ||
    event?.headers?.["X-Language"] ||
    event?.headers?.["x-asha-language"] ||
    event?.headers?.["X-Asha-Language"];
  const raw = fields.language || headerLanguage || "en";
  const normalized = normalizeLanguage(raw);

  if (normalized === "auto") {
    const hint = normalizeLanguage(
      fields.preferredLanguage || fields.languageHint || headerLanguage
    );
    return hint === "sw" ? "sw" : "en";
  }

  return normalized;
}

async function handleStt(event, user) {
  const startTime = Date.now();
  const authHeader =
    event?.headers?.authorization || event?.headers?.Authorization || "";
  const requestContentType =
    event?.headers?.["content-type"] ||
    event?.headers?.["Content-Type"] ||
    event?.headers?.["contentType"] ||
    "";
  const logInfo = {
    route: "/asha/voice/stt",
    uid: user?.uid,
    status: "success",
    language: "en",
  };
  let azureSecretLoaded = false;

  try {
    const { fields, files } = await parseMultipart(event);
    const file =
      files.find((item) => item.fieldname === "file") ||
      files.find((item) => item.fieldname === "audio") ||
      files[0];
    const fileFieldNames = files.map((item) => item.fieldname).filter(Boolean);
    const formFieldNames = Object.keys(fields || {});

    logSttDiagnostics({
      authHeaderPresent: Boolean(authHeader),
      contentType: requestContentType || null,
      fileFields: fileFieldNames,
      formFields: formFieldNames,
      fileMimeType: file?.contentType || null,
      fileSize: file?.buffer?.length || 0,
    });

    if (!file || !file.buffer.length) {
      logInfo.status = "error";
      logInfo.errorCode = 400;
      return badRequest(event, "No audio uploaded");
    }

    const contentType = (file.contentType || "").toLowerCase();
    const isSupportedType =
      contentType.includes("audio/webm") ||
      contentType.includes("audio/wav") ||
      contentType.includes("audio/mpeg");
    if (contentType && !isSupportedType) {
      logInfo.status = "error";
      logInfo.errorCode = 400;
      return badRequest(event, "Unsupported audio format");
    }

    const { speechKey, speechRegion } = await getAzureSpeechCredentials();
    azureSecretLoaded = true;
    logSttDiagnostics({
      azureSecretLoaded,
      azureKeyPresent: Boolean(speechKey),
      azureRegionPresent: Boolean(speechRegion),
    });

    if (!speechKey || !speechRegion) {
      const error = new Error("Azure Speech not configured");
      error.statusCode = 500;
      throw error;
    }

    const language = resolveSttLanguage(event, fields);

    logInfo.language = language;
    enforceRateLimit(user.uid);

    let result;
    try {
      result = await transcribeAudio({
        buffer: file.buffer,
        language,
        speechKey,
        speechRegion,
        contentType: file.contentType,
      });
    } catch (error) {
      if (error?.code === "FFMPEG") {
        error.statusCode = 500;
        error.message = "Audio conversion failed";
      } else if (!error?.statusCode) {
        error.statusCode = 502;
        error.message = "Azure speech recognition failed.";
      }

      logSttDiagnostics({
        azureSdkErrorCode: error?.code || null,
        azureSdkErrorMessage: error?.message || null,
      });
      throw error;
    }

    if (result?.conversion) {
      logSttDiagnostics({
        ffmpegInvoked: result.conversion.invoked,
        ffmpegExitCode: result.conversion.exitCode ?? null,
      });
    }

    logInfo.language = result.language || language;

    return ok(event, {
      text: result.text,
      language: result.language,
      confidence: result.confidence ?? 0,
    });
  } catch (error) {
    logInfo.status = "error";
    logInfo.errorCode = error?.statusCode || error?.code || "ERROR";
    if (error?.code === "FFMPEG") {
      logSttDiagnostics({
        ffmpegInvoked: true,
        ffmpegExitCode: error.exitCode ?? null,
      });
    }
    logSttDiagnostics({
      azureSecretLoaded,
      errorCode: logInfo.errorCode,
    });
    throw error;
  } finally {
    logInfo.latencyMs = Date.now() - startTime;
    logVoiceEvent(logInfo);
  }
}

async function handleTts(event, user) {
  const startTime = Date.now();
  const body = parseJsonBody(event.body);
  const requestedLanguage = mapLocaleToShortCode(
    body?.language || body?.locale || "en"
  );
  const logInfo = {
    route: "/asha/voice/tts",
    uid: user?.uid,
    status: "success",
    language: requestedLanguage,
  };

  try {
    const text = body?.text?.trim();
    if (!text) {
      logInfo.status = "error";
      logInfo.errorCode = 400;
      return badRequest(event, "Text is required for speech synthesis.");
    }

    const format = (body?.format || "mp3").toLowerCase();
    const voice = body?.voice;

    logInfo.language = requestedLanguage;
    enforceRateLimit(user.uid);

    const { speechKey, speechRegion } = await getAzureSpeechCredentials();

    let result;
    try {
      result = await synthesizeSpeech({
        text,
        voice,
        format,
        language: requestedLanguage,
        speechKey,
        speechRegion,
      });
    } catch (error) {
      if (!error?.statusCode) {
        error.statusCode = 502;
        error.message = "Azure speech synthesis failed.";
      }
      throw error;
    }

    return ok(event, {
      audioBase64: result.buffer.toString("base64"),
      contentType: result.contentType,
    });
  } catch (error) {
    logInfo.status = "error";
    logInfo.errorCode = error?.statusCode || error?.code || "ERROR";
    throw error;
  } finally {
    logInfo.latencyMs = Date.now() - startTime;
    logVoiceEvent(logInfo);
  }
}

function resolveVoiceError(event, error) {
  if (!error) {
    return serverError(event);
  }
  if (error.statusCode === 400) {
    return badRequest(event, error.message || "Bad Request");
  }
  if (error.statusCode === 401) {
    return unauthorized(event, error.message || "Unauthorized");
  }
  if (error.statusCode === 429) {
    return tooManyRequests(event, error.message || "Too many requests");
  }
  if (error.statusCode === 502) {
    return jsonResponse(event, 502, {
      message: error.message || "Speech service error",
    });
  }
  if (error.statusCode === 500) {
    return serverError(event, error.message || "Internal Server Error");
  }
  return null;
}

exports.handler = async (event) => {
  try {
    if (isOptionsRequest(event)) {
      return preflightResponse(event);
    }

    const user = await requireAuth(event);
    const method =
      event?.requestContext?.http?.method || event?.httpMethod || "GET";
    const path = getPath(event);
    const normalizedPath = path.toLowerCase();

    if (method === "POST" && normalizedPath.endsWith("/asha/voice/stt")) {
      return await handleStt(event, user);
    }

    if (method === "POST" && normalizedPath.endsWith("/asha/voice/tts")) {
      return await handleTts(event, user);
    }

    return badRequest(event, "Route not found");
  } catch (error) {
    if (error?.statusCode && error.statusCode !== 500) {
      console.error(error);
    }
    return resolveVoiceError(event, error) || handleError(event, error);
  }
};
