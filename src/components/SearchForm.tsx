import React, { useState } from 'react';
import { api } from '../services/api';
import { Case } from '../types/case';
import { Search } from 'lucide-react';

interface SearchFormProps {
  onSearch: (results: Case[]) => void;
  setIsSearching: (isSearching: boolean) => void;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, setIsSearching }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'number' | 'description' | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSearching(true);

    try {
      const response = await api.get(
        `/api/cases/search?term=${encodeURIComponent(searchTerm)}&type=${searchType}`
      );
      
      if (response.ok) {
        const data = await response.json();
        onSearch(data);
      } else {
        const data = await response.json();
        setError(data.message || 'Erro ao realizar busca');
        onSearch([]);
      }
    } catch (err) {
      setError('Erro de conexão. Verifique se o servidor está rodando.');
      onSearch([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">
            Termo de Busca
          </label>
          <div className="relative">
            <input
              id="searchTerm"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite para buscar..."
              required
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <Search size={18} />
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar por
          </label>
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="searchType"
                value="all"
                checked={searchType === 'all'}
                onChange={() => setSearchType('all')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2">Todos os campos</span>
            </label>
            
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="searchType"
                value="name"
                checked={searchType === 'name'}
                onChange={() => setSearchType('name')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2">Nome</span>
            </label>
            
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="searchType"
                value="number"
                checked={searchType === 'number'}
                onChange={() => setSearchType('number')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2">Número</span>
            </label>
            
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="searchType"
                value="description"
                checked={searchType === 'description'}
                onChange={() => setSearchType('description')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2">Descrição</span>
            </label>
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center"
        >
          <Search size={18} className="mr-2" />
          Buscar Processos
        </button>
      </form>
    </div>
  );
};

export default SearchForm;