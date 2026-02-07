const WORKER_BASE_URL = "https://agrismart-uploads.ridgejunior204.workers.dev";

type UploadResponse = {
  ok: boolean;
  key: string;
  url: string;
};

export async function uploadToR2(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${WORKER_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  const data = (await response.json()) as UploadResponse;

  if (!data?.ok || !data?.url) {
    throw new Error("Upload failed");
  }

  if (data.url.startsWith("http")) {
    return data.url;
  }

  return `${WORKER_BASE_URL}${data.url}`;
}

export async function uploadToR2WithKey(
  file: File,
  key: string
): Promise<{ url: string; key: string; contentType: string; size: number }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("key", key);
  formData.append("contentType", file.type || "application/octet-stream");

  const response = await fetch(`${WORKER_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }

  const data = (await response.json()) as UploadResponse;

  if (!data?.ok || !data?.url) {
    throw new Error("Upload failed");
  }

  const url = data.url.startsWith("http") ? data.url : `${WORKER_BASE_URL}${data.url}`;
  return {
    url,
    key: data.key || key,
    contentType: file.type || "application/octet-stream",
    size: file.size,
  };
}
