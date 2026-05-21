import { ChatRequest, ChatResponse, Conversation, MessageOut } from "@/types/chat";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Baca token dari localStorage — key 'token' sesuai auth-context.tsx
 */
function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token") ?? "";   // ← key 'token' bukan 'access_token'
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail ?? "Unknown error");
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const chatApi = {
  sendMessage: (body: ChatRequest) =>
    request<ChatResponse>("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listConversations: () =>
    request<Conversation[]>("/api/ai/conversations"),

  getMessages: (conversationId: string) =>
    request<MessageOut[]>(`/api/ai/conversations/${conversationId}/messages`),

  deleteConversation: (conversationId: string) =>
    request<void>(`/api/ai/conversations/${conversationId}`, {
      method: "DELETE",
    }),
};