"use client";

import { useCallback, useState } from "react";
import { Modal } from "./modal";
import { Button } from "./primitives";

type ConfirmTone = "default" | "danger";

export interface ConfirmOptions {
  title: string;
  description?: string;
  tone?: ConfirmTone;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
}

export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const ask = useCallback((opts: ConfirmOptions) => setOptions(opts), []);
  const close = useCallback(() => setOptions(null), []);

  const handleConfirm = useCallback(async () => {
    if (!options) return;
    setSubmitting(true);
    try {
      await options.onConfirm();
    } finally {
      setSubmitting(false);
    }
  }, [options]);

  return {
    ask,
    close,
    confirmProps: {
      open: Boolean(options),
      title: options?.title ?? "",
      description: options?.description,
      tone: options?.tone,
      confirmLabel: options?.confirmLabel,
      cancelLabel: options?.cancelLabel,
      submitting,
      onConfirm: handleConfirm,
      onClose: close,
    } satisfies ConfirmDialogProps,
  };
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  tone?: ConfirmTone;
  confirmLabel?: string;
  cancelLabel?: string;
  submitting?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  tone = "default",
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  submitting = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          {cancelLabel}
        </Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} onClick={() => void onConfirm()} loading={submitting}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
