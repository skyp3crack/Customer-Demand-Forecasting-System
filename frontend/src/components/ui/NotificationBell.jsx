import { useState, useRef, useEffect } from 'react';
import { Bell, Check, X, Clock } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import Notification from './Notification';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, clearAllNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAllAsRead = () => {
    notifications.forEach(notif => {
      if (!notif.read) {
        markAsRead(notif.id);
      }
    });
  };

  const handleClearAll = () => {
    clearAllNotifications();
  };

  const unreadNotifications = notifications.filter(notif => !notif.read);
  const hasUnread = unreadCount > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
        onClick={handleBellClick}
      >
        <Bell className="w-5 h-5" />
        {hasUnread && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>


      {isOpen && (
        <div className="absolute right-0 z-50 w-80 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-slate-800 dark:border dark:border-slate-700">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-900 dark:text-white">
                Notifications
                {hasUnread && (
                  <span className="ml-2 text-xs font-normal text-white bg-red-500 rounded-full px-2 py-0.5">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              <div className="flex space-x-2">
                {hasUnread && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Mark all as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Clear all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>


          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-slate-700">
                {notifications.map((notification) => (
                  <div key={notification.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <Notification {...notification} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <Clock className="w-10 h-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">We'll notify you when something arrives</p>
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 text-center border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
