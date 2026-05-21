"use client";

import { useState, useCallback, useEffect } from "react";
import { ChatMessage, Conversation, MessageOut } from "@/types/chat";
import { chatApi } from "@/services/chatApi";

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function fromApi(m: MessageOut): ChatMessage {
  return {
    id: String(m.id),
    role: m.role,
    content: m.content,
    provider: m.provider as any,
    model: m.model,
    timestamp: new Date(m.created_at),
  };
}

export function useChatbot() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // ── Load conversation list milik user yang login ───────────────────────────
  const refreshConversations = useCallback(() => {
    chatApi
      .listConversations()          // ← tidak perlu kirim user_id, JWT handle di backend
      .then(setConversations)
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // ── Pilih conversation dan load pesannya ──────────────────────────────────
  const selectConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
    setIsLoadingHistory(true);
    try {
      const msgs = await chatApi.getMessages(id);
      setMessages(msgs.map(fromApi));
    } catch {
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // ── Mulai percakapan baru ─────────────────────────────────────────────────
  const newConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  // ── Kirim pesan ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const data = await chatApi.sendMessage({
          message: content.trim(),
          conversation_id: activeConversationId ?? undefined,
          // ← tidak ada user_id di sini, diambil dari JWT di backend
        });

        // Jika percakapan baru, update conversation_id dan refresh sidebar
        if (!activeConversationId) {
          setActiveConversationId(data.conversation_id);
          refreshConversations();
        }

        const assistantMsg: ChatMessage = {
          id: uid(),
          role: "assistant",
          content: data.response,
          provider: data.provider as any,
          model: data.model,
          routingReason: data.routing_reason,
          totalTokens: data.total_tokens,
          costUsd: data.cost_usd,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const isUnauth =
          err instanceof Error && err.message.toLowerCase().includes("401");
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: isUnauth
              ? "Sesi Anda telah berakhir. Silakan login kembali."
              : err instanceof Error
              ? err.message
              : "Terjadi kesalahan.",
            timestamp: new Date(),
            isError: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversationId, isLoading, refreshConversations]
  );

  // ── Hapus conversation ────────────────────────────────────────────────────
  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        await chatApi.deleteConversation(id);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) newConversation();
      } catch {
        // silent — user tetap lihat listnya
      }
    },
    [activeConversationId, newConversation]
  );

  return {
    conversations,
    activeConversationId,
    messages,
    isLoading,
    isLoadingHistory,
    sendMessage,
    selectConversation,
    newConversation,
    deleteConversation,
  };
}
