let Busboy;
try {
  Busboy = require("busboy");
} catch {
  Busboy = null;
}

const {
  badRequest,
  forbidden,
  isOptionsRequest,
  jsonResponse,
  ok,
  preflightResponse,
  serverError,
  unauthorized,
} = require("../lib/response");
const { authenticateRequest } = require("../lib/authFirebase");

const parseJsonBody = (body) => {
  if (!body) return {};
  if (typeof body === "object") return body;
  const sanitized = typeof body === "string" ? body.replace(/^\uFEFF/, "") : body;
  try {
    return JSON.parse(sanitized);
  } catch {
    try {
      const decoded = Buffer.from(sanitized, "base64").toString("utf8");
      return JSON.parse(decoded);
    } catch {
      const error = new Error("Invalid JSON body");
      error.statusCode = 400;
      throw error;
    }
  }
};

const resolvePath = (event) =>
  event?.requestContext?.http?.path || event?.path || event?.rawPath || "";
const resolveMethod = (event) =>
  event?.requestContext?.http?.method || event?.httpMethod || "GET";

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    const error = new Error(`Missing ${name}`);
    error.statusCode = 500;
    throw error;
  }
  return value;
};

const normalizeEndpoint = (value) => (value || "").replace(/\/+$/, "");

const azureConfig = () => ({
  endpoint: normalizeEndpoint(requireEnv("AZURE_OPENAI_ENDPOINT")),
  apiKey: requireEnv("AZURE_OPENAI_API_KEY"),
  chatDeployment: requireEnv("AZURE_OPENAI_CHAT_DEPLOYMENT"),
  sttDeployment: requireEnv("AZURE_OPENAI_STT_DEPLOYMENT"),
  ttsDeployment: requireEnv("AZURE_OPENAI_TTS_DEPLOYMENT"),
  apiVersionChat: process.env.AZURE_OPENAI_API_VERSION_CHAT || "2024-02-15-preview",
  apiVersionAudio: process.env.AZURE_OPENAI_API_VERSION_AUDIO || "2025-03-01-preview",
});

const parseMultipart = async (event) => {
  const headers = event?.headers || {};
  const contentType = headers["content-type"] || headers["Content-Type"] || "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    const error = new Error("Expected multipart/form-data");
    error.statusCode = 400;
    throw error;
  }
  if (typeof Busboy !== "function") {
    const error = new Error("Multipart parser unavailable");
    error.statusCode = 500;
    throw error;
  }

  const bodyBuffer = event.body
    ? Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8")
    : Buffer.alloc(0);

  return new Promise((resolve, reject) => {
    const busboy = new Busboy({ headers: { "content-type": contentType } });
    const fields = {};
    const files = [];

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("file", (fieldname, fileStream, filename, encoding, mimetype) => {
      const chunks = [];
      fileStream.on("data", (chunk) => chunks.push(chunk));
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
    busboy.on("finish", () => resolve({ fields, files }));
    busboy.end(bodyBuffer);
  });
};

const parseSttInput = async (event) => {
  const headers = event?.headers || {};
  const contentType = (headers["content-type"] || headers["Content-Type"] || "").toLowerCase();

  if (contentType.includes("multipart/form-data")) {
    const { fields, files } = await parseMultipart(event);
    const file = files.find((f) => f.fieldname === "file") || files[0];
    if (!file || !file.buffer?.length) {
      const error = new Error("No audio file uploaded.");
      error.statusCode = 400;
      throw error;
    }
    return {
      fileName: file.filename || "audio.webm",
      mimeType: file.contentType || "audio/webm",
      buffer: file.buffer,
      language: fields.language || "en",
      prompt: fields.prompt || undefined,
    };
  }

  const body = parseJsonBody(event.body);
  const audioBase64 = body?.audioBase64 || body?.audio || body?.data;
  if (!audioBase64 || typeof audioBase64 !== "string") {
    const error = new Error("Missing audioBase64 payload.");
    error.statusCode = 400;
    throw error;
  }
  const stripped = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64;
  return {
    fileName: body?.fileName || "audio.webm",
    mimeType: body?.mimeType || "audio/webm",
    buffer: Buffer.from(stripped, "base64"),
    language: body?.language || "en",
    prompt: body?.prompt,
  };
};

const fetchAzure = async (url, init, apiKey) => {
  const res = await fetch(url, {
    ...init,
    headers: {
      "api-key": apiKey,
      ...(init?.headers || {}),
    },
  });
  return res;
};

const parseAzureError = async (response) => {
  try {
    const data = await response.json();
    return data?.error?.message || data?.message || JSON.stringify(data);
  } catch {
    return await response.text();
  }
};

const postChatCompletion = async (cfg, payload) => {
  const url = `${cfg.endpoint}/openai/deployments/${cfg.chatDeployment}/chat/completions?api-version=${cfg.apiVersionChat}`;
  return fetchAzure(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    cfg.apiKey
  );
};

const extractReplyText = (data) => {
  const choice = data?.choices?.[0];
  const content = choice?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const joined = content
      .map((part) => {
        if (typeof part === "string") return part;
        if (typeof part?.text === "string") return part.text;
        if (typeof part?.content === "string") return part.content;
        return "";
      })
      .filter(Boolean)
      .join(" ")
      .trim();
    if (joined) return joined;
  }

  if (typeof choice?.text === "string" && choice.text.trim()) {
    return choice.text.trim();
  }

  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  return "";
};

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeAdvisoryInput = (body) => {
  const cropName = cleanText(body?.crop?.name) || cleanText(body?.crop) || cleanText(body?.cropName);
  const growthStage = cleanText(body?.crop?.stage) || cleanText(body?.growthStage) || cleanText(body?.stage);
  const languageRaw = cleanText(body?.language).toLowerCase();
  const language = languageRaw === "sw" ? "sw" : "en";

  const farmContextRaw =
    (body?.farmContext && typeof body.farmContext === "object" ? body.farmContext : null) ||
    (body?.farm && typeof body.farm === "object" ? body.farm : {});
  const climateContextRaw =
    (body?.climateContext && typeof body.climateContext === "object" ? body.climateContext : null) ||
    (body?.weather && typeof body.weather === "object" ? body.weather : {});
  const marketContextRaw =
    (body?.marketContext && typeof body.marketContext === "object" ? body.marketContext : null) ||
    (body?.market && typeof body.market === "object" ? body.market : {});

  const weatherDaily = Array.isArray(climateContextRaw?.daily) ? climateContextRaw.daily : [];
  const alertsArray = Array.isArray(climateContextRaw?.alerts)
    ? climateContextRaw.alerts.map((entry) =>
        typeof entry === "string"
          ? entry
          : cleanText(entry?.message || entry?.title || entry?.type)
      )
    : Array.isArray(climateContextRaw?.alerts)
    ? climateContextRaw.alerts
    : [];
  const alerts = alertsArray.filter(Boolean);

  const marketTop = Array.isArray(marketContextRaw?.topMarkets) ? marketContextRaw.topMarkets[0] : null;
  const derivedPrice =
    typeof marketContextRaw?.pricePerKg === "number"
      ? marketContextRaw.pricePerKg
      : typeof marketContextRaw?.netPrice === "number"
      ? marketContextRaw.netPrice
      : typeof marketTop?.retail === "number"
      ? marketTop.retail
      : typeof marketTop?.wholesale === "number"
      ? marketTop.wholesale
      : null;

  const derivedTrend =
    cleanText(marketContextRaw?.priceTrend) ||
    cleanText(marketContextRaw?.trend7d) ||
    cleanText(marketTop?.trend7d) ||
    "flat";

  const farmContext = {
    county: cleanText(farmContextRaw?.county),
    ward: cleanText(farmContextRaw?.ward),
    lat:
      typeof farmContextRaw?.lat === "number"
        ? farmContextRaw.lat
        : typeof farmContextRaw?.latitude === "number"
        ? farmContextRaw.latitude
        : null,
    lon:
      typeof farmContextRaw?.lon === "number"
        ? farmContextRaw.lon
        : typeof farmContextRaw?.lng === "number"
        ? farmContextRaw.lng
        : null,
    crops: Array.isArray(farmContextRaw?.crops) ? farmContextRaw.crops.filter(Boolean).map(String) : [],
    mainCrop: cleanText(farmContextRaw?.mainCrop),
  };

  const climateContext = {
    forecastSummary:
      cleanText(climateContextRaw?.forecastSummary) ||
      cleanText(climateContextRaw?.summary) ||
      cleanText(climateContextRaw?.weatherSummary),
    rainfallChance:
      typeof climateContextRaw?.rainfallChance === "number"
        ? climateContextRaw.rainfallChance
        : typeof weatherDaily?.[0]?.rainChancePct === "number"
        ? weatherDaily[0].rainChancePct
        : null,
    tempMin:
      typeof climateContextRaw?.tempMin === "number"
        ? climateContextRaw.tempMin
        : typeof weatherDaily?.[0]?.minTempC === "number"
        ? weatherDaily[0].minTempC
        : null,
    tempMax:
      typeof climateContextRaw?.tempMax === "number"
        ? climateContextRaw.tempMax
        : typeof weatherDaily?.[0]?.maxTempC === "number"
        ? weatherDaily[0].maxTempC
        : null,
    alerts,
  };

  const marketContext = {
    marketName: cleanText(marketContextRaw?.marketName) || cleanText(marketContextRaw?.market) || cleanText(marketTop?.market),
    pricePerKg: derivedPrice,
    priceTrend: ["up", "down", "flat"].includes(derivedTrend) ? derivedTrend : "flat",
    updatedAt:
      cleanText(marketContextRaw?.updatedAt) ||
      cleanText(marketContextRaw?.lastUpdated) ||
      cleanText(marketTop?.lastUpdated),
  };

  return {
    crop: cropName,
    growthStage,
    language,
    farmId: cleanText(body?.farmId) || null,
    farmContext,
    climateContext,
    marketContext,
  };
};

const advisorySystemPrompt = (language) =>
  [
    "You are AgriSmart Climate Advisor for Kenyan farmers.",
    "Always answer with practical, farmer-friendly guidance.",
    "Never refuse due to missing context. Use best-practice assumptions and ask one short follow-up only if needed.",
    language === "sw"
      ? "Primary language is Kiswahili with simple farming terms."
      : "Primary language is English for farmers in Kenya.",
    "Return STRICT JSON object only with keys:",
    "title, summary, todayActions, weeklyWatch, marketAngle, riskAlerts, swahiliNote.",
    "summary must be 2-3 lines max.",
    "todayActions/weeklyWatch/riskAlerts must be arrays of short bullet strings.",
    "marketAngle must mention sell/hold/harvest timing when market data exists.",
    "swahiliNote should be short and helpful; can be empty for English if not needed.",
  ].join(" ");

const buildAdvisoryUserPrompt = (input) =>
  JSON.stringify(
    {
      crop: input.crop || "unknown",
      growthStage: input.growthStage || "unknown",
      farmId: input.farmId || null,
      farmContext: input.farmContext,
      climateContext: input.climateContext,
      marketContext: input.marketContext,
    },
    null,
    2
  );

const safeParseJson = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
};

const coerceArray = (value) =>
  Array.isArray(value)
    ? value.map((item) => cleanText(typeof item === "string" ? item : item?.text || item?.message)).filter(Boolean)
    : [];

const normalizeAdvisorySections = (reply, parsed, input) => {
  const summaryFallback = input.crop
    ? `Guidance for ${input.crop}${input.growthStage ? ` at ${input.growthStage} stage` : ""}.`
    : "General farm guidance based on current context.";

  const title = cleanText(parsed?.title) || "AI Advisory";
  const summary = cleanText(parsed?.summary) || cleanText(reply) || summaryFallback;
  const todayActions = coerceArray(parsed?.todayActions);
  const weeklyWatch = coerceArray(parsed?.weeklyWatch);
  const marketAngle =
    cleanText(parsed?.marketAngle) ||
    (input.marketContext?.pricePerKg != null
      ? `Current indicative price is KES ${input.marketContext.pricePerKg}/kg. Consider timing harvest based on demand trend (${input.marketContext.priceTrend}).`
      : "Market data is limited. Compare current prices before deciding to sell.");
  const riskAlerts = coerceArray(parsed?.riskAlerts);
  const swahiliNote =
    cleanText(parsed?.swahiliNote) ||
    (input.language === "sw" ? "Endelea kufuatilia hali ya hewa kila siku." : "");

  const advisoryLines = [
    `Title: ${title}`,
    `Summary: ${summary}`,
    "What to do today:",
    ...(todayActions.length ? todayActions.map((row) => `- ${row}`) : ["- Start with basic field scouting and moisture checks."]),
    "What to watch this week:",
    ...(weeklyWatch.length ? weeklyWatch.map((row) => `- ${row}`) : ["- Monitor rainfall changes and pest pressure trends."]),
    `Market angle: ${marketAngle}`,
    "Risk alerts:",
    ...(riskAlerts.length ? riskAlerts.map((row) => `- ${row}`) : ["- No high-risk alerts available from current data."]),
  ];
  if (swahiliNote) advisoryLines.push(`Swahili note: ${swahiliNote}`);

  return {
    title,
    summary,
    todayActions,
    weeklyWatch,
    marketAngle,
    riskAlerts,
    swahiliNote,
    advisoryText: advisoryLines.join("\n"),
  };
};

const buildEnrichmentSystemMessage = (body, user) => {
  const context = body?.context && typeof body.context === "object" ? body.context : {};
  const farm =
    (context?.farm && typeof context.farm === "object" ? context.farm : null) ||
    (body?.farm && typeof body.farm === "object" ? body.farm : {});
  const weather =
    (context?.climate && typeof context.climate === "object" ? context.climate : null) ||
    (context?.weather && typeof context.weather === "object" ? context.weather : {});
  const market = context?.market && typeof context.market === "object" ? context.market : {};
  const language = typeof body?.language === "string" ? body.language.toLowerCase() : "en";
  const swPreferred = language.startsWith("sw");

  const cropList = Array.isArray(farm.crops) ? farm.crops.filter(Boolean).join(", ") : "";
  const weatherBits = [];
  if (typeof weather.minTemp === "number" || typeof weather.maxTemp === "number") {
    weatherBits.push(`temp ${weather.minTemp ?? "-"}C to ${weather.maxTemp ?? "-"}C`);
  }
  if (typeof weather.rainChance === "number") {
    weatherBits.push(`rain chance ${weather.rainChance}%`);
  }

  const marketBits = [];
  if (market.commodity) marketBits.push(`commodity ${market.commodity}`);
  if (typeof market.retail === "number") marketBits.push(`retail ${market.retail} KES/kg`);
  if (typeof market.wholesale === "number") marketBits.push(`wholesale ${market.wholesale} KES/kg`);
  if (market.market) marketBits.push(`market ${market.market}`);

  return [
    "You are Asha, AgriSmart's assistant for Kenyan smallholder farmers.",
    "General chat is always allowed. Do not refuse non-farming questions.",
    "Use practical, simple language and short actionable steps.",
    swPreferred
      ? "Prefer Kiswahili-friendly phrasing, unless the user explicitly asks for English."
      : "Prefer clear English. You may add simple Kiswahili terms where useful.",
    "When farming context exists, include: 1) summary, 2) crop-by-crop advice with price/weather risk and recommendation, 3) one follow-up question only if needed.",
    "Ask at most one follow-up question when required.",
    `User role: ${body?.role || user?.role || "farmer"}.`,
    `Farm county: ${farm.county || "unknown"}, ward: ${farm.ward || "unknown"}, crops: ${cropList || "unknown"}, farmId: ${farm.farmId || "unknown"}.`,
    `Weather snapshot: ${weatherBits.join(", ") || "not available"}.`,
    `Market snapshot: ${marketBits.join(", ") || "not available"}.`,
  ].join(" ");
};

const handleChat = async (event, user) => {
  const body = parseJsonBody(event.body);
  const inputMessages = Array.isArray(body?.messages) ? body.messages : null;
  const userMessage = typeof body?.message === "string" ? body.message.trim() : "";
  const rawMessages =
    inputMessages && inputMessages.length
      ? inputMessages
      : userMessage
      ? [{ role: "user", content: userMessage }]
      : null;
  if (!rawMessages) return badRequest(event, "messages or message is required.");

  const systemMessage = buildEnrichmentSystemMessage(body, user);
  const messages = [{ role: "system", content: systemMessage }, ...rawMessages];

  const cfg = azureConfig();
  const payload = {
    messages,
    max_completion_tokens:
      typeof body?.max_completion_tokens === "number"
        ? body.max_completion_tokens
        : 800,
  };

  const response = await postChatCompletion(cfg, payload);
  if (!response.ok) {
    const errorText = await parseAzureError(response);
    return jsonResponse(event, response.status, {
      ok: false,
      error: errorText || "Azure chat request failed.",
    });
  }
  let data = await response.json();
  let reply = extractReplyText(data);

  // Fallback path: always answer as a general assistant when no tool-specific response exists.
  if (!reply) {
    const lastUserMessage =
      [...rawMessages]
        .reverse()
        .find((m) => m && m.role === "user" && typeof m.content === "string")
        ?.content || userMessage || "Help me with my request.";

    const fallbackPayload = {
      messages: [
        { role: "system", content: "You are Asha, a helpful AI assistant. Answer naturally and clearly." },
        { role: "user", content: lastUserMessage },
      ],
      max_completion_tokens: 400,
    };

    const fallbackResponse = await postChatCompletion(cfg, fallbackPayload);
    if (!fallbackResponse.ok) {
      const errorText = await parseAzureError(fallbackResponse);
      return jsonResponse(event, fallbackResponse.status, {
        ok: false,
        error: errorText || "Azure chat fallback request failed.",
      });
    }

    data = await fallbackResponse.json();
    reply = extractReplyText(data);
  }

  return ok(event, {
    ok: true,
    reply: reply || "I’m here and ready to help. Could you rephrase your question?",
    model: data?.model || null,
    usage: data?.usage || null,
    provider: "azure-openai",
    requestor: { uid: user.uid, role: user.role || null },
  });
};

const handleAdvisoryGenerate = async (event, user) => {
  const body = parseJsonBody(event.body);
  const input = normalizeAdvisoryInput(body);

  if (!input.crop) return badRequest(event, "crop is required.");
  if (!input.growthStage) return badRequest(event, "growthStage is required.");

  const cfg = azureConfig();
  const payload = {
    messages: [
      { role: "system", content: advisorySystemPrompt(input.language) },
      { role: "user", content: buildAdvisoryUserPrompt(input) },
    ],
    max_completion_tokens:
      typeof body?.max_completion_tokens === "number" ? body.max_completion_tokens : 900,
  };

  const response = await postChatCompletion(cfg, payload);
  if (!response.ok) {
    const errorText = await parseAzureError(response);
    return jsonResponse(event, response.status, {
      ok: false,
      error: errorText || "Azure advisory request failed.",
    });
  }

  const data = await response.json();
  const reply = extractReplyText(data);
  const parsed = safeParseJson(reply);
  const normalized = normalizeAdvisorySections(reply, parsed, input);

  return ok(event, {
    ok: true,
    advisory: normalized.advisoryText,
    title: normalized.title,
    summary: normalized.summary,
    actions: normalized.todayActions,
    weeklyWatch: normalized.weeklyWatch,
    marketAdvice: normalized.marketAngle,
    risks: normalized.riskAlerts,
    swahiliNote: normalized.swahiliNote,
    dataUsed: body?.dataUsed || null,
    meta: {
      model: data?.model || null,
      usage: data?.usage || null,
      sources: {
        farmContext: Boolean(input.farmContext?.county || input.farmContext?.lat != null),
        climateContext: Boolean(input.climateContext?.forecastSummary || input.climateContext?.alerts?.length),
        marketContext: Boolean(input.marketContext?.pricePerKg != null || input.marketContext?.marketName),
      },
    },
    provider: "azure-openai",
    requestor: { uid: user.uid, role: user.role || null },
  });
};

const handleStt = async (event, user) => {
  const input = await parseSttInput(event);
  const cfg = azureConfig();
  const url = `${cfg.endpoint}/openai/deployments/${cfg.sttDeployment}/audio/transcriptions?api-version=${cfg.apiVersionAudio}`;

  const form = new FormData();
  form.append(
    "file",
    new Blob([input.buffer], { type: input.mimeType || "application/octet-stream" }),
    input.fileName || "audio.webm"
  );
  form.append("response_format", "json");
  if (input.language) form.append("language", input.language);
  if (input.prompt) form.append("prompt", input.prompt);

  const response = await fetchAzure(
    url,
    { method: "POST", body: form },
    cfg.apiKey
  );

  if (!response.ok) {
    const errorText = await parseAzureError(response);
    return jsonResponse(event, response.status, {
      ok: false,
      error: errorText || "Azure speech-to-text failed.",
    });
  }

  const data = await response.json();
  return ok(event, {
    ok: true,
    text: data?.text || "",
    language: input.language || "en",
    provider: "azure-openai",
    requestor: { uid: user.uid, role: user.role || null },
  });
};

const handleTts = async (event, user) => {
  const body = parseJsonBody(event.body);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return badRequest(event, "text is required.");

  const cfg = azureConfig();
  const url = `${cfg.endpoint}/openai/deployments/${cfg.ttsDeployment}/audio/speech?api-version=${cfg.apiVersionAudio}`;
  const format = String(body?.format || "mp3").toLowerCase() === "wav" ? "wav" : "mp3";
  const voice = String(body?.voice || "alloy");

  const response = await fetchAzure(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: text,
        voice,
        response_format: format,
      }),
    },
    cfg.apiKey
  );
  if (!response.ok) {
    const errorText = await parseAzureError(response);
    return jsonResponse(event, response.status, {
      ok: false,
      error: errorText || "Azure text-to-speech failed.",
    });
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = format === "wav" ? "audio/wav" : "audio/mpeg";
  return ok(event, {
    ok: true,
    audioBase64: buffer.toString("base64"),
    contentType,
    provider: "azure-openai",
    requestor: { uid: user.uid, role: user.role || null },
  });
};

exports.handler = async (event) => {
  if (isOptionsRequest(event)) return preflightResponse(event);

  try {
    const user = await authenticateRequest(event);
    if (!user?.uid) return unauthorized(event, "Unauthorized");

    const method = resolveMethod(event).toUpperCase();
    const path = resolvePath(event).toLowerCase();

    if (method === "POST" && path.endsWith("/asha/chat")) {
      return await handleChat(event, user);
    }
    if (method === "POST" && path.endsWith("/asha/stt")) {
      return await handleStt(event, user);
    }
    if (method === "POST" && path.endsWith("/asha/tts")) {
      return await handleTts(event, user);
    }
    if (method === "POST" && (path.endsWith("/advisory/generate") || path.endsWith("/asha/advisory/generate"))) {
      return await handleAdvisoryGenerate(event, user);
    }
    return badRequest(event, "Route not found");
  } catch (error) {
    if (error?.statusCode === 401) return unauthorized(event, error.message);
    if (error?.statusCode === 403) return forbidden(event, error.message);
    if (error?.statusCode === 400) return badRequest(event, error.message);
    console.error("[AshaAzure] handler error", error);
    return serverError(event, error?.message || "Internal Server Error");
  }
};
