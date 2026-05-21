export type ProviderName = "ollama" | "openai" | "claude" | "gemini" | "openrouter" | "groq";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: ProviderName;
  model?: string;
  routingReason?: string;
  totalTokens?: number;
  costUsd?: number;
  timestamp: Date;
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  provider?: ProviderName;
  // user_id dihapus — diambil dari JWT di backend
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
  provider: string;
  model: string;
  routing_reason: string;
  total_tokens: number;
  cost_usd: number;
}

export interface MessageOut {
  id: number;
  role: "user" | "assistant";
  content: string;
  provider?: string;
  model?: string;
  created_at: string;
}

export const PROVIDER_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  ollama:      { label: "Ollama",      color: "bg-slate-100 text-slate-700",     emoji: "🖥️" },
  openai:      { label: "GPT",         color: "bg-emerald-100 text-emerald-700", emoji: "✦"  },
  claude:      { label: "Claude",      color: "bg-orange-100 text-orange-700",   emoji: "◆"  },
  gemini:      { label: "Gemini",      color: "bg-blue-100 text-blue-700",       emoji: "✦"  },
  openrouter:  { label: "OpenRouter",  color: "bg-purple-100 text-purple-700",   emoji: "⇄"  },
  groq:        { label: "Groq",        color: "bg-rose-100 text-rose-700",       emoji: "⚡"  },
};
