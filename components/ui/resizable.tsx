"use client";

import {
  PanelGroup as PanelGroupPrimitive,
  Panel as PanelPrimitive,
  PanelResizeHandle as PanelResizeHandlePrimitive,
} from "react-resizable-panels";
import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({
  className,
  ...props
}: ComponentProps<typeof PanelGroupPrimitive>) => (
  <PanelGroupPrimitive
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
);

const ResizablePanel = PanelPrimitive;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: ComponentProps<typeof PanelResizeHandlePrimitive> & {
  withHandle?: boolean;
}) => (
  <PanelResizeHandlePrimitive
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <div className="h-2.5 w-1 rounded-full bg-muted-foreground" />
      </div>
    )}
  </PanelResizeHandlePrimitive>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
