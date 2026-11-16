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
      <p className="mb-6 text-sm text-gray-700">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
