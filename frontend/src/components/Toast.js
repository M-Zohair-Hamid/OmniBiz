import React, { useEffect } from 'react';

const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }[type] || 'bg-blue-500';

  return (
    <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg mb-2 flex items-center justify-between`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 font-bold">×</button>
    </div>
  );
};

export default Toast;
