"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface QuestionStepProps {
  children: ReactNode;
  className?: string;
}

export function QuestionStep({ children, className }: QuestionStepProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in-0 duration-300",
        className
      )}
    >
      {children}
    </div>
  );
}

