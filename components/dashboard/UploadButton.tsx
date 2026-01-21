"use client";

import { useState, useEffect } from "react";
import { FileUp, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation"; // Tambahkan ini

export default function UploadButton() {
  const router = useRouter(); // Inisialisasi router
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => {
        setShowModal(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setShowModal(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setStatus({ type: "success", message: result.message });
        setShowModal(true);
        
        // --- LOGIC REFRESH DATA TANPA RELOAD WINDOW ---
        router.refresh(); 
        
      } else {
        setStatus({ type: "error", message: result.error });
        setShowModal(true);
      }
    } catch (error) {
      setStatus({ type: "error", message: "Network Error: Gagal terhubung ke server" });
      setShowModal(true);
    } finally {
      setUploading(false);
      e.target.value = ""; 
    }
  };

  return (
    <div className="relative">
      {/* Kode UI Modal tetap sama (tidak diubah) */}
      <div className={`
        fixed top-10 left-1/2 -translate-x-1/2 z-[99]
        flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl border
        transition-all duration-500 ease-in-out
        ${showModal ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}
        ${status?.type === "success" ? "bg-white border-green-100" : "bg-white border-red-100"}
      `}>
        {status?.type === "success" ? (
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        ) : (
          <XCircle className="w-6 h-6 text-red-500" />
        )}
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-800">
            {status?.type === "success" ? "Berhasil!" : "Terjadi Kesalahan"}
          </span>
          <span className="text-xs text-slate-500">{status?.message}</span>
        </div>
      </div>

      {/* Kode UI Label Button tetap sama (tidak diubah) */}
      <label className={`
        w-auto min-w-[180px] lg:w-auto 
        cursor-pointer group flex items-center justify-center gap-2 
        bg-black/20 hover:bg-white border border-white/20 
        text-white hover:text-orange-600 
        px-5 py-2 rounded-lg transition-all duration-300 shadow-xl active:scale-95
        ${uploading ? "opacity-70 pointer-events-none" : ""} 
      `}>
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileUp className="w-4 h-4 opacity-80" />
        )}
        
        <span className="text-[11px] font-medium tracking-[0.15em]">
          {uploading ? "Processing..." : "Add Data (.xlsx)"}
        </span>

        <input 
          type="file" 
          accept=".xlsx, .xls" 
          className="hidden" 
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
    </div>
  );
}