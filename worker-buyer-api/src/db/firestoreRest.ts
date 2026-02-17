import type { Env } from "../types";
import { HttpError } from "../domain/errors";
import { getGoogleAccessToken } from "./googleAuth";

const firestoreBase = (projectId: string) => `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

type FirestoreValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { nullValue: null }
  | { timestampValue: string }
  | { mapValue: { fields: Record<string, FirestoreValue> } }
  | { arrayValue: { values: FirestoreValue[] } };

type FirestoreDoc = { name: string; fields?: Record<string, FirestoreValue> };

const encodeValue = (value: unknown): FirestoreValue => {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    if (Number.isInteger(value)) return { integerValue: String(value) };
    return { doubleValue: value };
  }
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (typeof value === "object") {
    const fields: Record<string, FirestoreValue> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      fields[k] = encodeValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
};

const decodeValue = (value: FirestoreValue | undefined): unknown => {
  if (!value) return undefined;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("nullValue" in value) return null;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(decodeValue);
  if ("mapValue" in value) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value.mapValue.fields || {})) out[k] = decodeValue(v as FirestoreValue);
    return out;
  }
  return undefined;
};

const decodeDoc = <T>(doc: FirestoreDoc | null): T | null => {
  if (!doc?.fields) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    out[k] = decodeValue(v as FirestoreValue);
  }
  return out as T;
};

async function firestoreRequest<T>(env: Env, path: string, init?: RequestInit): Promise<T> {
  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new HttpError(500, "CONFIG_ERROR", "Missing FIREBASE_PROJECT_ID");

  const token = await getGoogleAccessToken(env);
  const response = await fetch(`${firestoreBase(projectId)}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 404) throw new HttpError(404, "NOT_FOUND", "Document not found");
    throw new HttpError(500, "FIRESTORE_ERROR", "Firestore request failed", text);
  }

  return (await response.json()) as T;
}

export async function getDocument<T>(env: Env, docPath: string): Promise<T | null> {
  try {
    const doc = await firestoreRequest<FirestoreDoc>(env, `/${docPath}`);
    return decodeDoc<T>(doc);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return null;
    throw error;
  }
}

export async function setDocument(env: Env, docPath: string, data: Record<string, unknown>, merge = true): Promise<void> {
  const fields: Record<string, FirestoreValue> = {};
  for (const [k, v] of Object.entries(data)) fields[k] = encodeValue(v);

  const query = merge ? "?updateMask.fieldPaths=" + Object.keys(data).map(encodeURIComponent).join("&updateMask.fieldPaths=") : "";

  await firestoreRequest(env, `/${docPath}${query}`, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
}

export async function createDocumentAutoId(env: Env, collectionPath: string, data: Record<string, unknown>): Promise<void> {
  const fields: Record<string, FirestoreValue> = {};
  for (const [k, v] of Object.entries(data)) fields[k] = encodeValue(v);

  await firestoreRequest(env, `/${collectionPath}`, {
    method: "POST",
    body: JSON.stringify({ fields }),
  });
}

export async function runStructuredQuery<T>(
  env: Env,
  structuredQuery: Record<string, unknown>
): Promise<T[]> {
  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new HttpError(500, "CONFIG_ERROR", "Missing FIREBASE_PROJECT_ID");
  const token = await getGoogleAccessToken(env);

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ structuredQuery }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new HttpError(500, "FIRESTORE_QUERY_ERROR", "Firestore query failed", text);
  }

  const rows = (await response.json()) as Array<{ document?: FirestoreDoc }>;
  return rows.map((row) => decodeDoc<T>(row.document || null)).filter(Boolean) as T[];
}
