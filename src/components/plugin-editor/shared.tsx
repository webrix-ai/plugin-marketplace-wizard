"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Button variant="ghost" size="icon-xs" onClick={copy} title="Copy">
      {copied ? <Check className="text-emerald-500" /> : <Copy />}
    </Button>
  );
}

export function JsonBlock({ data }: { data: unknown }) {
  const json = JSON.stringify(data, null, 2);
  return (
    <div className="relative">
      <div className="absolute top-1.5 right-1.5 z-10">
        <CopyButton text={json} />
      </div>
      <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-[11px] leading-relaxed text-primary">
        <code>{json}</code>
      </pre>
    </div>
  );
}
