import { useCallback } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';

const useToast = () => {
  const { addNotification } = useNotifications();

  const toast = useCallback(({ type = 'info', message, title, duration = 5000 }) => {
    return addNotification({
      type,
      message,
      title: title || type.charAt(0).toUpperCase() + type.slice(1),
      autoClose: duration,
    });
  }, [addNotification]);

  // Helper methods for common notification types
  toast.success = (message, title = 'Success', duration = 8000000) => 
    toast({ type: 'success', message, title, duration });
    
  toast.error = (message, title = 'Error', duration = 15000) => 
    toast({ type: 'error', message, title, duration });
    
  toast.warning = (message, title = 'Warning', duration = 10000) => 
    toast({ type: 'warning', message, title, duration });
    
  toast.info = (message, title = 'Info', duration = 8000) => 
    toast({ type: 'info', message, title, duration });

  return toast;
};

export default useToast;
