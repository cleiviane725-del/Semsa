import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useNotification } from '../../hooks/useNotification';

const Layout = () => {
  const { checkExpiryDates, checkLowStock } = useNotification();
  
  // Check for notifications on first render
  useEffect(() => {
    checkExpiryDates();
    checkLowStock();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;