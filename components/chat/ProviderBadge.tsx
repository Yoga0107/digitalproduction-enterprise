"use client";

import { PROVIDER_LABELS } from "@/types/chat";

interface ProviderBadgeProps {
  provider: string;
  model?: string;
  totalTokens?: number;
}

export function ProviderBadge({ provider, model, totalTokens }: ProviderBadgeProps) {
  const meta = PROVIDER_LABELS[provider] ?? { label: provider, color: "bg-gray-100 text-gray-600", emoji: "🤖" };

  return (
    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
        <span>{meta.emoji}</span>
        {meta.label}
      </span>
      {model && (
        <span className="text-[10px] text-gray-400 font-mono">{model}</span>
      )}
      {totalTokens != null && totalTokens > 0 && (
        <span className="text-[10px] text-gray-400">{totalTokens.toLocaleString()} tok</span>
      )}
    </div>
  );
}
