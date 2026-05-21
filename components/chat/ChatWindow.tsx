"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage, Conversation } from "@/types/chat";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatInput } from "./ChatInput";
import { ConversationSidebar } from "./ConversationSidebar";

interface ChatWindowProps {
  messages: ChatMessage[];
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  isLoadingHistory: boolean;
  onSend: (message: string) => void;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onClose: () => void;
}

function TypingIndicator() {
  return (
    <div className="flex items-start mb-4">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2 shadow-sm">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1 shadow-sm">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

const QUICK_QUESTIONS = ["Apa itu OEE?", "Hitung availability line 3", "Analisis downtime terbesar"];

export function ChatWindow({
  messages,
  conversations,
  activeConversationId,
  isLoading,
  isLoadingHistory,
  onSend,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onClose,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex w-[420px] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`
          flex-shrink-0 transition-all duration-300 overflow-hidden
          ${sidebarOpen ? "w-[180px]" : "w-0"}
        `}
      >
        <div className="w-[180px] h-full">
          <ConversationSidebar
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={(id) => { onSelectConversation(id); setSidebarOpen(false); }}
            onNew={() => { onNewConversation(); setSidebarOpen(false); }}
            onDelete={onDeleteConversation}
          />
        </div>
      </div>

      {/* Main chat panel */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title="Riwayat percakapan"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">AI Assistant</p>
              <p className="text-[10px] text-white/60 mt-0.5">Multi-LLM · Smart routing</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onNewConversation}
              title="Chat baru"
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={onClose}
              title="Tutup"
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-3 pt-4 pb-2 bg-gray-50">
          {/* Loading history spinner */}
          {isLoadingHistory && (
            <div className="flex justify-center py-8">
              <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          )}

          {/* Empty state */}
          {!isLoadingHistory && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">AI Assistant siap membantu</p>
                <p className="text-xs text-gray-400 mt-1">Routing otomatis ke model terbaik</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-1">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => onSend(q)}
                    className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {!isLoadingHistory && messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}

          {/* Typing indicator */}
          {isLoading && <TypingIndicator />}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <ChatInput onSend={onSend} isLoading={isLoading} />
      </div>
    </div>
  );
}
