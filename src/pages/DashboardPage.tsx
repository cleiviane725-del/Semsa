import React, { useState } from 'react';
import Header from '../components/Header';
import CaseForm from '../components/CaseForm';
import SearchForm from '../components/SearchForm';
import CaseList from '../components/CaseList';
import { Case } from '../types/case';
import { api } from '../services/api';

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'register' | 'search'>('register');
  const [searchResults, setSearchResults] = useState<Case[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm('Tem certeza que deseja excluir este processo?');
    if (confirmDelete) {
      const response = await api.delete(`/api/cases/${id}`);
      if (response.ok) {
        setSearchResults(prev => prev.filter(item => item.id !== id));
      } else {
        alert('Erro ao excluir o processo');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {activeTab === 'register' ? (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Cadastrar Novo Processo</h2>
            <CaseForm />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Buscar Processos</h2>
            <SearchForm 
              onSearch={setSearchResults} 
              setIsSearching={setIsSearching} 
            />
            
            <div className="mt-8">
              <CaseList 
                cases={searchResults} 
                isLoading={isSearching}
                onDelete={handleDelete}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;