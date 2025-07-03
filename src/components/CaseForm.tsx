import React, { useState } from 'react';
import { api } from '../services/api';
import { FileText, Save, Upload } from 'lucide-react';

const CaseForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    description: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf' || selectedFile.type.includes('word')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Por favor, selecione apenas arquivos PDF ou Word');
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(null);
    setError(null);

    try {
      let fileData = null;
      if (file) {
        const buffer = await file.arrayBuffer();
        fileData = {
          name: file.name,
          type: file.type,
          data: buffer
        };
      }

      const response = await api.post('/api/cases', {
        ...formData,
        file: fileData
      });
      
      if (response.ok) {
        setSuccess('Processo cadastrado com sucesso!');
        setFormData({ name: '', number: '', description: '' });
        setFile(null);
      } else {
        const data = await response.json();
        setError(data.message || 'Erro ao cadastrar processo');
      }
    } catch (err) {
      setError('Erro de conexão. Verifique se o servidor está rodando.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-700 rounded-md flex items-center">
          <FileText size={18} className="mr-2" />
          {success}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Processo
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
            Número do Processo
          </label>
          <input
            id="number"
            name="number"
            type="text"
            value={formData.number}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Descrição de Referência
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          ></textarea>
        </div>

        <div className="mb-6">
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
            Arquivo (PDF ou Word)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <Upload size={24} className="mx-auto text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label htmlFor="file" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <span>Selecionar arquivo</span>
                  <input
                    id="file"
                    name="file"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">PDF ou Word até 10MB</p>
              {file && (
                <p className="text-sm text-gray-600">
                  Arquivo selecionado: {file.name}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center"
        >
          {isSubmitting ? (
            <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
          ) : (
            <Save size={18} className="mr-2" />
          )}
          {isSubmitting ? 'Salvando...' : 'Salvar Processo'}
        </button>
      </form>
    </div>
  );
};

export default CaseForm;