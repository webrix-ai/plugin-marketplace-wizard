"use client";

import { memo } from "react";
import type { NodeProps, Node } from "@xyflow/react";

export type CategoryGroupData = { label: string };
export type CategoryGroupNodeType = Node<CategoryGroupData, "categoryGroup">;

function CategoryGroupNode({ data }: NodeProps<CategoryGroupNodeType>) {
  return (
    <div className="h-full w-full rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/5">
      <div className="px-5 pt-4">
        <span className="rounded-md bg-muted/60 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          {data.label}
        </span>
      </div>
    </div>
  );
}

export default memo(CategoryGroupNode);
