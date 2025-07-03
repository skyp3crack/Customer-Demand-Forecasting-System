import { createContext, useContext, useReducer, useCallback } from 'react';

const NotificationContext = createContext();

// Action types
const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';
const MARK_AS_READ = 'MARK_AS_READ';
const CLEAR_ALL = 'CLEAR_ALL';

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
};

// Reducer function
const notificationReducer = (state, action) => {
  switch (action.type) {
    case ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    case REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(notif => notif.id !== action.payload),
        unreadCount: state.notifications.some(n => n.id === action.payload && !n.read) 
          ? state.unreadCount - 1 
          : state.unreadCount,
      };
    case MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notif =>
          notif.id === action.payload ? { ...notif, read: true } : notif
        ),
        unreadCount: state.unreadCount - 1,
      };
    case CLEAR_ALL:
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };
    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const addNotification = useCallback(({ type = 'info', message, title, autoClose = 5000 }) => {
    const id = Date.now().toString();
    const notification = { id, type, message, title, read: false, date: new Date() };
    
    dispatch({ type: ADD_NOTIFICATION, payload: notification });

    if (autoClose) {
      setTimeout(() => {
        dispatch({ type: REMOVE_NOTIFICATION, payload: id });
      }, autoClose);
    }

    return id;
  }, []); // Removed dispatch from dependency array as it's stable

  const removeNotification = useCallback((id) => {
    dispatch({ type: REMOVE_NOTIFICATION, payload: id });
  }, []);

  const markAsRead = useCallback((id) => {
    dispatch({ type: MARK_AS_READ, payload: id });
  }, []);

  const clearAllNotifications = useCallback(() => {
    dispatch({ type: CLEAR_ALL });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        addNotification,
        removeNotification,
        markAsRead,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
