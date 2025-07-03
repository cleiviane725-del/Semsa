import { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';

const Header = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="w-64">
          <div className="relative">
            <input
              type="text"
              placeholder="Pesquisar..."
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full hover:bg-gray-100"
            >
              <Bell className="h-6 w-6 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-danger-500 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-20 animate-fade-in">
                <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Notificações</h3>
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Marcar todas como lidas
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Nenhuma notificação
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {notifications.slice(0, 5).map((notification) => (
                        <li
                          key={notification.id}
                          className={`p-3 hover:bg-gray-50 cursor-pointer ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start">
                            <div
                              className={`h-2 w-2 mt-1.5 mr-2 rounded-full ${
                                notification.type === 'warning'
                                  ? 'bg-warning-500'
                                  : notification.type === 'error'
                                  ? 'bg-danger-500'
                                  : notification.type === 'success'
                                  ? 'bg-success-500'
                                  : 'bg-primary-500'
                              }`}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{notification.title}</p>
                              <p className="text-sm text-gray-600">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md"
            >
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500">
                  {user?.role === 'admin' ? 'Administrador' : `Farmacêutico - ${user?.ubsName}`}
                </p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 animate-fade-in">
                <ul className="py-1">
                  <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Meu Perfil</span>
                    </div>
                  </li>
                  <li
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-danger-600 flex items-center gap-2"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;