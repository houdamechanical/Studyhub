"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

/** Small "are you sure?" modal. Escape or the backdrop cancels; focus starts on Cancel. */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive = false,
  pending = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
      <button type="button" aria-hidden tabIndex={-1} onClick={onCancel} className="dialog-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="dialog-panel relative w-full max-w-sm rounded-xl border bg-popover p-5 shadow-2xl">
        <h2 id="confirm-title" className="font-display text-base font-semibold">
          {title}
        </h2>
        {body && <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button ref={cancelRef} variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm} disabled={pending}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
