"use client";

import { FileDown } from "lucide-react";

export default function DownloadButton() {
  const handleDownload = async () => {
    try {
      window.location.href = "/api/template";
    } catch (error) {
      console.error("Download failed", error);
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="
        w-auto min-w-[180px] lg:w-auto 
        cursor-pointer group flex items-center justify-center gap-2 
        bg-black/20 hover:bg-white border border-white/20 
        text-white hover:text-orange-600
        px-5 py-2 rounded-lg transition-all duration-300 shadow-xl active:scale-95"
    >
      <FileDown className="w-4 h-4 opacity-80" />
      <span className="text-[11px] font-medium tracking-[0.15em]">
        Download Template (.xlsx)
      </span>
    </button>
  );
}