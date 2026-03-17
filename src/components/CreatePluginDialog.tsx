"use client";

import { useState, useRef, useEffect } from "react";
import { X, Package } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { slugify } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
}

export function CreatePluginDialog({ open, onClose, position }: Props) {
  const { addPlugin } = useWizardStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const slug = slugify(name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addPlugin(name.trim(), description.trim(), position);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#12161f] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10">
              <Package className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">Create Plugin</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Plugin Name
              </label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Plugin"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
              />
              {slug && (
                <p className="mt-1.5 text-[10px] text-slate-600">
                  Slug: <span className="text-slate-500">{slug}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this plugin do?"
                rows={3}
                className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white/[0.06] px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.1]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              Create Plugin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
