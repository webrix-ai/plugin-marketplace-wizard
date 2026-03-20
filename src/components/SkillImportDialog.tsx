"use client";

import { AlertTriangle } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function SkillImportErrorDialog() {
  const error = useWizardStore((s) => s.skillImportError);
  const setError = useWizardStore((s) => s.setSkillImportError);

  return (
    <Dialog open={!!error} onOpenChange={(open) => !open && setError(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import failed</DialogTitle>
          <DialogDescription>
            Could not import the skill file.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
        <DialogFooter>
          <Button size="sm" onClick={() => setError(null)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
