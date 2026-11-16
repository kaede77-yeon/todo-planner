"use client";

import Modal from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "확인",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="mb-6 text-sm text-ink">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm px-3 py-2 text-sm text-ink hover:bg-surface-soft"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="rounded-sm bg-error px-3 py-2 text-sm text-white hover:bg-error-hover disabled:opacity-50"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
