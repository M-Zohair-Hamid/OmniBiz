import { useState, useCallback, useEffect } from 'react';

/**
 * Hook to handle smooth modal open/close animations
 * Returns closing state and handlers
 */
export const useModalAnimation = (isOpen = false) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = useCallback((onClose, delay = 400) => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, delay);
  }, []);

  return { isClosing, handleClose };
};

/**
 * Get animation classes for backdrop based on closing state
 */
export const getBackdropAnimationClass = (isClosing) => {
  return isClosing ? 'animate-fadeOut' : 'animate-fadeIn';
};

/**
 * Get animation classes for modal content based on closing state
 */
export const getModalAnimationClass = (isClosing, type = 'scale') => {
  if (type === 'slide') {
    return isClosing ? 'animate-slideOutRight' : 'animate-slideInRight';
  }
  return isClosing ? 'animate-scaleOut' : 'animate-scaleIn';
};
