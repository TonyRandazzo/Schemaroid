import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Elimina',
  cancelLabel = 'Annulla',
  variant = 'danger',
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setBusy(false);
    const id = setTimeout(() => cancelRef.current?.focus(), 0);
    return () => clearTimeout(id);
  }, [isOpen]);

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Operazione non riuscita');
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={busy ? () => {} : onClose} labelledBy="confirm-dialog-title">
      <div className="flex gap-4">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
            variant === 'danger' ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-accent-soft-fg'
          }`}
          aria-hidden="true"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <h2 id="confirm-dialog-title" className="text-base font-semibold text-fg">
            {title}
          </h2>
          {message && <p className="mt-1.5 text-sm text-fg-muted">{message}</p>}

          {error && (
            <p className="mt-3 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <Button ref={cancelRef} type="button" variant="secondary" onClick={onClose} disabled={busy}>
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={variant === 'danger' ? 'dangerSolid' : 'primary'}
              onClick={handleConfirm}
              disabled={busy}
            >
              {busy ? 'Attendere…' : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
