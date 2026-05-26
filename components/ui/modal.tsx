"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  size?: "md" | "lg" | "xl";
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  size = "lg",
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const sizeClass = {
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[size];

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "sn-modal fixed inset-0 z-[100] m-auto w-[calc(100%-2rem)] border-0 bg-transparent p-0 backdrop:bg-[rgba(6,14,24,0.72)] backdrop:backdrop-blur-sm",
        sizeClass
      )}
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div
        className={cn(
          "sn-modal-panel relative max-h-[85vh] overflow-hidden rounded-2xl border border-[rgba(196,163,90,0.15)] bg-[rgba(10,21,32,0.96)] shadow-2xl",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(196,163,90,0.1)] px-6 py-5">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-[var(--sn-gold)]">
              {title}
            </h2>
            {description && (
              <p id="modal-description" className="mt-1 text-sm text-[rgba(248,246,242,0.6)]">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[rgba(248,246,242,0.5)] transition hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--sn-gold)]"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </dialog>
  );
}
