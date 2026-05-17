import { useState, useRef, useCallback } from 'react';

export interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  title: string;
  confirmLabel: string;
  variant: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function useConfirmModal() {
  const [open, setOpen]       = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle]     = useState('Confirmation');
  const [confirmLabel, setConfirmLabel] = useState('Supprimer');
  const [variant, setVariant] = useState<'danger' | 'warning' | 'default'>('danger');
  const resolveRef = useRef<(v: boolean) => void>(() => {});

  const confirm = useCallback((
    msg: string,
    options?: { title?: string; confirmLabel?: string; variant?: 'danger' | 'warning' | 'default' }
  ): Promise<boolean> => {
    setMessage(msg);
    setTitle(options?.title ?? 'Confirmation');
    setConfirmLabel(options?.confirmLabel ?? 'Confirmer');
    setVariant(options?.variant ?? 'danger');
    setOpen(true);
    return new Promise(resolve => { resolveRef.current = resolve; });
  }, []);

  const handleConfirm = () => { setOpen(false); resolveRef.current(true); };
  const handleCancel  = () => { setOpen(false); resolveRef.current(false); };

  const confirmModalProps: ConfirmModalProps = {
    isOpen: open, message, title, confirmLabel, variant,
    onConfirm: handleConfirm,
    onCancel:  handleCancel,
  };

  return { confirm, confirmModalProps };
}
