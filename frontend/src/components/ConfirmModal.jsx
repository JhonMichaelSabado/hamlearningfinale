import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, title = 'Confirm', message, confirmText = 'OK', cancelText = 'Cancel', onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <h3>{title}</h3>
        </div>

        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>

        <div className="confirm-modal-footer">
          <button className="confirm-cancel" onClick={onCancel}>{cancelText}</button>
          <button className="confirm-ok" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
