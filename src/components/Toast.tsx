"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Toast() {
  const { toast, setToast } = useWizardStore();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast, setToast]);

  if (!toast) return null;

  const Icon =
    toast.type === "success"
      ? CheckCircle2
      : toast.type === "error"
        ? XCircle
        : Info;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-2">
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-lg border px-4 py-2.5 shadow-lg",
          toast.type === "success" &&
            "border-emerald-500/20 bg-emerald-950/80 text-emerald-300",
          toast.type === "error" &&
            "border-red-500/20 bg-red-950/80 text-red-300",
          toast.type === "info" &&
            "border-blue-500/20 bg-blue-950/80 text-blue-300"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <p className="text-xs font-medium">{toast.message}</p>
        <button
          onClick={() => setToast(null)}
          className="ml-2 rounded p-0.5 transition hover:bg-white/10"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
