export async function generateAdvisory(payload: Record<string, any>) {
  const baseUrl = import.meta.env.VITE_ADVISORY_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("Missing VITE_ADVISORY_API_BASE_URL");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/advisory/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, error: text };
    }

    if (!response.ok || data?.ok === false) {
      throw new Error(data?.error || `Request failed (${response.status})`);
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}
