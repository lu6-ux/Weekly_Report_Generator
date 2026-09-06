"use client";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
export default function Modal({
  title,
  description,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      aria-describedby={description ? `${id}-description` : undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      className="app-dialog"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id={id} className="text-lg">
            {title}
          </h2>
          {description && (
            <p
              id={`${id}-description`}
              className="mt-2 text-sm leading-6 text-slate-500"
            >
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className="icon-button"
          aria-label="Close dialog"
        >
          <X size={19} />
        </button>
      </div>
      <div className="mt-6">{children}</div>
    </dialog>
  );
}
