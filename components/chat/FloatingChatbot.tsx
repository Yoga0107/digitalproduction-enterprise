"use client";

import { useState } from "react";
import { ChatWindow } from "./ChatWindow";
import { useChatbot } from "@/hooks/useChatbot";

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    conversations,
    activeConversationId,
    messages,
    isLoading,
    isLoadingHistory,
    sendMessage,
    selectConversation,
    newConversation,
    deleteConversation,
  } = useChatbot();

  const unreadCount = !isOpen && messages.length > 0 ? messages.length : 0;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat window — animated mount/unmount */}
      <div
        className={`
          transition-all duration-300 ease-in-out origin-bottom-right
          ${isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
          }
        `}
      >
        <ChatWindow
          messages={messages}
          conversations={conversations}
          activeConversationId={activeConversationId}
          isLoading={isLoading}
          isLoadingHistory={isLoadingHistory}
          onSend={sendMessage}
          onSelectConversation={selectConversation}
          onNewConversation={newConversation}
          onDeleteConversation={deleteConversation}
          onClose={() => setIsOpen(false)}
        />
      </div>

      {/* Floating button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Tutup chatbot" : "Buka chatbot"}
        className="
          relative w-14 h-14 rounded-full
          bg-gradient-to-br from-blue-600 to-indigo-600
          shadow-lg hover:shadow-xl
          hover:scale-105 active:scale-95
          transition-all duration-200
          flex items-center justify-center
        "
      >
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-[9px] text-white font-bold px-0.5">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}

        {/* Close icon */}
        <span className={`absolute transition-all duration-200 ${isOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"}`}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>

        {/* Chat icon */}
        <span className={`absolute transition-all duration-200 ${isOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"}`}>
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
          </svg>
        </span>
      </button>
    </div>
  );
}
