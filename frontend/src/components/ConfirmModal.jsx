import React, { useState, useEffect } from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({
  isOpen,
  title = 'Confirm',
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  requireInput = false,
  expectedText = '',
  inputPlaceholder = ''
}) => {
  const [inputValue, setInputValue] = useState('');
  const [canConfirm, setCanConfirm] = useState(!requireInput);

  useEffect(() => {
    setInputValue('');
    setCanConfirm(!requireInput);
  }, [isOpen, requireInput]);

  useEffect(() => {
    if (!requireInput) return;
    // require exact match (trimmed)
    setCanConfirm(String(inputValue).trim() === String(expectedText).trim());
  }, [inputValue, expectedText, requireInput]);

  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <h3>{title}</h3>
        </div>

        <div className="confirm-modal-body">
          <p>{message}</p>
          {requireInput && (
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#374151' }}>
                Please type the exact title to confirm:
              </label>
              <input
                className="confirm-input"
                placeholder={inputPlaceholder || expectedText}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="confirm-modal-footer">
          <button type="button" className="confirm-cancel" onClick={onCancel}>{cancelText}</button>
          <button type="button" className="confirm-ok" onClick={onConfirm} disabled={!canConfirm} style={{ opacity: canConfirm ? 1 : 0.6 }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
