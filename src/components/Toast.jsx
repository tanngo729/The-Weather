import { useEffect, useState } from 'react';

export default function Toast({ message, type = 'error', duration = 4000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`toast toast--${type} ${isExiting ? 'toast--exit' : ''}`}>
      <div className="toast__content">
        <i className={`fa-solid ${type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'} toast__icon`}></i>
        <span className="toast__message">{message}</span>
      </div>
    </div>
  );
}