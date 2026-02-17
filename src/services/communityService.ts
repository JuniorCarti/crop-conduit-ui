import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { waitForAuth } from "@/services/authService";
import type { CommunityPost, CommunityComment, MediaItem, PagedResult } from "@/types/community";

const API_BASE_URL = import.meta.env.VITE_COMMUNITY_API_BASE_URL;
const MEDIA_BUCKET = "agrismart-community-media";
const MEDIA_REGION = "us-east-2";

export async function getFirebaseIdToken(forceRefresh = false): Promise<string> {
  const current = auth.currentUser;
  if (current) {
    return current.getIdToken(forceRefresh);
  }
  const user = await waitForAuth(8000);
  return user.getIdToken(forceRefresh);
}

function buildQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

async function fetchWithAuth<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("VITE_COMMUNITY_API_BASE_URL is not set");
  }

  let token = "";
  try {
    token = await getFirebaseIdToken();
  } catch (error: any) {
    toast.error("Authentication not ready. Please sign in again.");
    throw error;
  }
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  } as Record<string, string>;

  if (!headers["Content-Type"] && options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    toast.error("Session expired. Please sign in again.");
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    let details = "Request failed";
    try {
      const data = await response.json();
      details = data?.message || details;
    } catch {
      // ignore
    }
    throw new Error(details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function normalizeTag(tag: string) {
  return tag.replace("#", "").replace(/[^A-Za-z0-9_]/g, "").toLowerCase();
}

function parseTextMeta(text: string) {
  const tokens = text.split(/\s+/).filter(Boolean);
  const tags: string[] = [];
  let crop: string | null = null;
  let location: string | null = null;

  tokens.forEach((token) => {
    if (token.startsWith("#crop:")) {
      crop = token.replace("#crop:", "").replace(/[_-]/g, " ");
      return;
    }
    if (token.startsWith("#loc:")) {
      location = token.replace("#loc:", "").replace(/[_-]/g, " ");
      return;
    }
    if (token.startsWith("#")) {
      const normalized = normalizeTag(token);
      if (normalized) tags.push(normalized);
    }
  });

  const cleaned = tokens
    .filter((token) => !token.startsWith("#crop:") && !token.startsWith("#loc:") && !token.startsWith("#"))
    .join(" ")
    .trim();

  return { cleanText: cleaned || text.trim(), tags, crop, location };
}

function buildTextWithMeta(text: string, tags: string[], crop?: string, location?: string) {
  const parsed = parseTextMeta(text);
  const mergedTags = new Set<string>([...parsed.tags, ...tags.map(normalizeTag)].filter(Boolean));
  const metaTokens = Array.from(mergedTags).map((tag) => `#${tag}`);
  const cropToken = crop || parsed.crop ? `#crop:${(crop || parsed.crop || "").replace(/\\s+/g, "_")}` : "";
  const locationToken = location || parsed.location ? `#loc:${(location || parsed.location || "").replace(/\\s+/g, "_")}` : "";
  const composed = [parsed.cleanText, ...metaTokens, cropToken, locationToken].filter(Boolean).join(" ");
  return composed.trim();
}

function buildMedia(imageKey?: string | null, signedImageUrl?: string | null): MediaItem[] {
  if (!imageKey && !signedImageUrl) return [];
  const url = signedImageUrl || imageKey || "";
  if (!url || url.includes("undefined") || url.endsWith("/undefined")) return [];
  const resolvedUrl = url.startsWith("http")
    ? url
    : `https://${MEDIA_BUCKET}.s3.${MEDIA_REGION}.amazonaws.com/${url}`;
  return [{ url: resolvedUrl, type: "image" }];
}

function mapPost(raw: any): CommunityPost {
  const parsed = parseTextMeta(raw?.text || "");
  const tags = Array.isArray(raw?.tags) && raw.tags.length ? raw.tags : parsed.tags;
  return {
    id: raw?.postId || raw?.id || "",
    userId: raw?.authorId || raw?.userId || "",
    authorName: raw?.authorName || raw?.authorEmail || "Farmer",
    location: raw?.location || parsed.location || null,
    crop: raw?.crop || parsed.crop || null,
    text: parsed.cleanText,
    tags,
    createdAt: raw?.createdAt || new Date().toISOString(),
    media: buildMedia(raw?.imageKey, raw?.signedImageUrl),
    counts: {
      likeCount: Number(raw?.reactionCount || 0),
      commentCount: Number(raw?.commentCount || 0),
    },
    likedByMe: false,
  };
}

function mapComment(raw: any): CommunityComment {
  return {
    id: raw?.commentId || raw?.id || raw?.commentKey || "",
    postId: raw?.postId || "",
    userId: raw?.authorId || raw?.userId || "",
    authorName: raw?.authorName || raw?.authorEmail || "Farmer",
    text: raw?.text || "",
    createdAt: raw?.createdAt || new Date().toISOString(),
  };
}

export async function listPosts(params: {
  q?: string;
  tag?: string;
  crop?: string;
  cursor?: string;
}): Promise<PagedResult<CommunityPost>> {
  const query = buildQuery({
    q: params.q,
    tag: params.tag,
    crop: params.crop,
    nextToken: params.cursor,
    limit: "12",
  });

  const data = await fetchWithAuth<{ items: any[]; nextToken?: string }>(
    `/community/posts${query}`,
  );

  return {
    items: (data.items || []).map(mapPost),
    nextCursor: data.nextToken || null,
  };
}

export async function createPost(payload: {
  text: string;
  tags: string[];
  crop?: string;
  location?: string;
  media?: { url: string; type: "image" | "video"; key?: string; contentType?: string }[];
}): Promise<CommunityPost> {
  const imageKey = payload.media?.[0]?.key ?? null;
  const body: Record<string, unknown> = {
    text: buildTextWithMeta(payload.text, payload.tags, payload.crop, payload.location),
  };
  if (imageKey) {
    body.imageKey = imageKey;
  }

  const data = await fetchWithAuth<{ post: any }>("/community/posts", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const post = mapPost(data.post);

  if (payload.media?.length) {
    post.media = payload.media;
  }

  return post;
}

export async function getPost(postId: string): Promise<CommunityPost> {
  const data = await fetchWithAuth<{ post: any }>(`/community/posts/${postId}`);
  return mapPost(data.post);
}

export async function listComments(postId: string, cursor?: string): Promise<PagedResult<CommunityComment>> {
  const query = buildQuery({ nextToken: cursor, limit: "20" });
  const data = await fetchWithAuth<{ items: any[]; nextToken?: string }>(
    `/community/posts/${postId}/comments${query}`,
  );

  return {
    items: (data.items || []).map(mapComment),
    nextCursor: data.nextToken || null,
  };
}

export async function addComment(postId: string, payload: { text: string }): Promise<CommunityComment> {
  const data = await fetchWithAuth<{ comment: any }>(`/community/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ text: payload.text }),
  });

  return mapComment(data.comment);
}

export async function reactToPost(
  postId: string,
  reaction: "like" | "helpful" | "insight",
): Promise<{ liked: boolean }> {
  const payload = { reactionType: reaction === "like" ? "like" : "like" };
  return fetchWithAuth(`/community/posts/${postId}/reactions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPresignedUpload(payload: {
  filename: string;
  contentType: string;
}): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
  const extension = payload.filename.split(".").pop() || "bin";
  const data = await fetchWithAuth<{ uploadUrl: string; key: string; fileUrl: string }>(
    "/community/uploads/presign",
    {
      method: "POST",
      body: JSON.stringify({
        filename: payload.filename,
        contentType: payload.contentType,
        fileExt: extension,
      }),
    },
  );

  return {
    uploadUrl: data.uploadUrl,
    fileUrl: data.fileUrl,
    key: data.key,
  };
}
