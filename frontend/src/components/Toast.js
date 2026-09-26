import React, { useEffect } from 'react';

const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 font-bold text-white/80 hover:text-white text-lg leading-none">x</button>
    </div>
  );
};

export default Toast;
