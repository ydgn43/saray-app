// src/components/exit/Modal.tsx
// A small Bootstrap-styled modal (no Bootstrap JavaScript needed). Closes with Esc or a click outside.

import { ReactNode, useEffect } from 'react';

interface ModalProps {
    title: string;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'lg' | 'xl';
}

export default function Modal({ title, onClose, children, footer, size }: ModalProps) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1500 }} onClick={onClose}>
            <div
                className={`modal-dialog modal-dialog-centered modal-dialog-scrollable${size ? ` modal-${size}` : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-content" style={{ borderRadius: 12, border: 'none' }}>
                    <div className="modal-header" style={{ borderBottom: '1px solid #eee' }}>
                        <h5 className="modal-title" style={{ fontWeight: 600, color: '#1e40af' }}>{title}</h5>
                        <button type="button" className="btn-close" aria-label="Kapat" onClick={onClose} />
                    </div>
                    <div className="modal-body">{children}</div>
                    {footer && <div className="modal-footer" style={{ borderTop: '1px solid #eee' }}>{footer}</div>}
                </div>
            </div>
        </div>
    );
}
