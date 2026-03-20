"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { slugify } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
}

export function CreatePluginDialog({ open, onClose, position }: Props) {
  const { addPlugin } = useWizardStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const slug = slugify(name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addPlugin(name.trim(), description.trim(), position);
    setName("");
    setDescription("");
    onClose();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setName("");
      setDescription("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Package className="size-3.5 text-primary" />
            </div>
            <div>
              <DialogTitle>Create Plugin</DialogTitle>
              <DialogDescription className="sr-only">
                Create a new marketplace plugin
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="plugin-name" className="text-xs">
              Plugin Name
            </Label>
            <Input
              id="plugin-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Plugin"
            />
            {slug && (
              <p className="text-[10px] text-muted-foreground">
                Slug: <span className="font-mono">{slug}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="plugin-desc" className="text-xs">
              Description
            </Label>
            <Textarea
              id="plugin-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this plugin do?"
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create Plugin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
