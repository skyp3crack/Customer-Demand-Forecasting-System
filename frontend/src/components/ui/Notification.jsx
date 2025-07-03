import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const Notification = ({ id, type = 'info', title, message, read, date }) => {
  const { removeNotification, markAsRead } = useNotifications();
  const notificationRef = useRef(null);

  const Icon = iconMap[type] || Info;

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  };

  useEffect(() => {
    // Auto-mark as read when notification is shown
    if (!read) {
      const timer = setTimeout(() => {
        markAsRead(id);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [id, markAsRead, read]);

  const handleClose = (e) => {
    e.stopPropagation();
    removeNotification(id);
  };

  return (
    <div
      ref={notificationRef}
      className={cn(
        'relative p-4 mb-2 rounded-lg border transition-all duration-200 shadow-sm hover:shadow-md',
        typeStyles[type],
        !read && 'ring-2 ring-offset-2 ring-opacity-50',
        !read && type === 'success' && 'ring-green-200',
        !read && type === 'error' && 'ring-red-200',
        !read && type === 'warning' && 'ring-yellow-200',
        !read && type === 'info' && 'ring-blue-200',
      )}
      onClick={() => markAsRead(id)}
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 mt-0.5 ${iconColors[type]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium">
              {title}
            </h3>
          )}
          <div className="mt-1 text-sm">
            <p>{message}</p>
          </div>
          <div className="mt-1 text-xs opacity-70">
            {new Date(date).toLocaleTimeString()}
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-500 focus:outline-none"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Notification;
