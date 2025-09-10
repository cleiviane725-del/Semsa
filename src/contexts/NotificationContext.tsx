import { createContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { isPast, differenceInDays } from 'date-fns';
import { useMedication } from '../hooks/useMedication';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  checkExpiryDates: () => void;
  checkLowStock: () => void;
}

export const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotifications: () => {},
  checkExpiryDates: () => {},
  checkLowStock: () => {},
});

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { medications, stock, locations } = useMedication();

  // Load notifications from localStorage
  useEffect(() => {
    const storedNotifications = localStorage.getItem('med_notifications');
    if (storedNotifications) {
      setNotifications(JSON.parse(storedNotifications));
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('med_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Add a new notification
  const addNotification = (
    notificationData: Omit<Notification, 'id' | 'read' | 'createdAt'>
  ) => {
    const newNotification: Notification = {
      ...notificationData,
      id: uuidv4(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Check for medications near expiry
  const checkExpiryDates = () => {
    const today = new Date();
    
    medications.forEach(medication => {
      const expiryDate = new Date(medication.expiryDate);
      
      if (isPast(expiryDate)) {
        // Already expired
        addNotification({
          type: 'error',
          title: 'Medicamento Vencido',
          message: `${medication.name} (Lote: ${medication.batch}) está vencido desde ${new Date(medication.expiryDate).toLocaleDateString()}.`,
        });
      } else {
        // Check if expiring soon (within 30 days)
        const daysUntilExpiry = differenceInDays(expiryDate, today);
        
        if (daysUntilExpiry <= 30) {
          addNotification({
            type: 'warning',
            title: 'Medicamento Próximo do Vencimento',
            message: `${medication.name} (Lote: ${medication.batch}) irá vencer em ${daysUntilExpiry} dias.`,
          });
        }
      }
    });
  };

  // Check for medications with low stock
  const checkLowStock = () => {
    // Check medications
    medications.forEach(medication => {
      const totalStock = stock
        .filter(item => item.itemId === medication.id && item.itemType === 'medication')
        .reduce((sum, item) => sum + item.quantity, 0);
      
      if (totalStock <= medication.minimumStock) {
        addNotification({
          type: 'warning',
          title: 'Estoque Baixo',
          message: `${medication.name} está com estoque baixo (${totalStock} unidades). Mínimo recomendado: ${medication.minimumStock}.`,
        });
      }
    });
    
    // Check utensils
    const { utensils } = useMedication();
    utensils.forEach(utensil => {
      const totalStock = stock
        .filter(item => item.itemId === utensil.id && item.itemType === 'utensil')
        .reduce((sum, item) => sum + item.quantity, 0);
      
      if (totalStock <= utensil.minimumStock) {
        addNotification({
          type: 'warning',
          title: 'Estoque Baixo - Utensílio',
          message: `${utensil.name} está com estoque baixo (${totalStock} unidades). Mínimo recomendado: ${utensil.minimumStock}.`,
        });
      }
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        checkExpiryDates,
        checkLowStock,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};