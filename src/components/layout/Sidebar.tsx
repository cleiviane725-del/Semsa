import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Heart, Package, Truck, ClipboardList, FileBadge as FileBar, Users, Home, ArrowLeft, ArrowRight, Boxes } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = () => {
  const { userRole } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={`bg-primary-700 text-white transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className={`flex items-center justify-between p-4 ${collapsed ? 'justify-center' : ''}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-white" />
            <span className="font-bold text-xl">SemsaControl</span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-full hover:bg-primary-600"
        >
          {collapsed ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
        </button>
      </div>
      
      <nav className="flex-1 mt-6">
        <ul className="space-y-1">
          <SidebarItem 
            to="/dashboard" 
            icon={<Home size={20} />} 
            label="Dashboard"
            collapsed={collapsed}
          />
          <SidebarItem 
            to="/medications" 
            icon={<Package size={20} />} 
            label="Medicamentos"
            collapsed={collapsed}
          />
          {(userRole === 'admin' || userRole === 'warehouse') && (
            <SidebarItem 
              to="/inventory" 
              icon={<Boxes size={20} />} 
              label="Controle de Estoque"
              collapsed={collapsed}
            />
          )}
          <SidebarItem 
            to="/distributions" 
            icon={<Truck size={20} />} 
            label="Distribuições"
            collapsed={collapsed}
          />
          <SidebarItem 
            to="/requests" 
            icon={<ClipboardList size={20} />} 
            label="Solicitações"
            collapsed={collapsed}
          />
          {userRole === 'pharmacist' && (
            <SidebarItem 
              to="/patient-distribution" 
              icon={<Users size={20} />} 
              label="Dispensação"
              collapsed={collapsed}
            />
          )}
          {(userRole === 'admin' || userRole === 'warehouse') && (
            <SidebarItem 
              to="/reports" 
              icon={<FileBar size={20} />} 
              label="Relatórios"
              collapsed={collapsed}
            />
          )}
        </ul>
      </nav>
      
      <div className={`p-4 text-sm text-primary-200 ${collapsed ? 'text-center' : ''}`}>
        {!collapsed && <span>SemsaControl v1.0</span>}
      </div>
    </aside>
  );
};

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}

const SidebarItem = ({ to, icon, label, collapsed }: SidebarItemProps) => {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) => 
          `flex items-center px-4 py-3 ${
            collapsed ? 'justify-center' : ''
          } transition-colors ${
            isActive 
              ? 'bg-primary-600 text-white font-medium' 
              : 'text-primary-100 hover:bg-primary-600 hover:text-white'
          }`
        }
      >
        <span className="flex-shrink-0">{icon}</span>
        {!collapsed && <span className="ml-3">{label}</span>}
      </NavLink>
    </li>
  );
};

export default Sidebar;