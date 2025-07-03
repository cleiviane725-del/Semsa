import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, FileText, Search, FilePlus } from 'lucide-react';

interface HeaderProps {
  activeTab: 'register' | 'search';
  setActiveTab: (tab: 'register' | 'search') => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { logout } = useAuth();

  return (
    <header className="bg-blue-800 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <FileText size={28} className="mr-2" />
            <h1 className="text-xl font-bold">Sistema de Processos</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => logout()}
              className="flex items-center px-3 py-2 rounded hover:bg-blue-700 transition-colors"
              aria-label="Sair"
            >
              <LogOut size={20} className="mr-1" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
        
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center px-4 py-3 border-b-2 font-medium transition-colors ${
              activeTab === 'register'
                ? 'border-white text-white'
                : 'border-transparent text-blue-200 hover:text-white'
            }`}
          >
            <FilePlus size={18} className="mr-2" />
            Cadastrar
          </button>
          
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center px-4 py-3 border-b-2 font-medium transition-colors ${
              activeTab === 'search'
                ? 'border-white text-white'
                : 'border-transparent text-blue-200 hover:text-white'
            }`}
          >
            <Search size={18} className="mr-2" />
            Buscar
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;