import React, { useState } from 'react';
import { Case } from '../types/case';
import { FileText, Calendar, Trash2, Eye } from 'lucide-react';

interface CaseListProps {
  cases: Case[];
  isLoading: boolean;
  onDelete: (id: number) => void;
}

const CaseList: React.FC<CaseListProps> = ({ cases, isLoading, onDelete }) => {
  const [viewingFile, setViewingFile] = useState<{ url: string; name: string } | null>(null);

  const handleViewFile = (caseItem: Case) => {
    if (caseItem.file) {
      const blob = new Blob([caseItem.file.data], { type: caseItem.file.type });
      const url = URL.createObjectURL(blob);
      setViewingFile({ url, name: caseItem.file.name });
    }
  };

  const closeViewer = () => {
    if (viewingFile) {
      URL.revokeObjectURL(viewingFile.url);
      setViewingFile(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="inline-block h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <FileText size={48} className="mx-auto text-gray-400 mb-3" />
        <p className="text-gray-500">Nenhum processo encontrado.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h3 className="text-lg font-semibold bg-gray-50 p-4 border-b">
          Resultados da Busca ({cases.length})
        </h3>
        
        <div className="divide-y divide-gray-200">
          {cases.map((caseItem) => (
            <div key={caseItem.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-blue-800">{caseItem.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="inline-flex items-center mr-3">
                      <FileText size={14} className="mr-1" />
                      {caseItem.number}
                    </span>
                    <span className="inline-flex items-center">
                      <Calendar size={14} className="mr-1" />
                      {new Date(caseItem.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </p>
                </div>
                <div className="flex space-x-2">
                  {caseItem.file && (
                    <button
                      onClick={() => handleViewFile(caseItem)}
                      className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                      title="Visualizar arquivo"
                    >
                      <Eye size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(caseItem.id)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    title="Excluir processo"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              
              <p className="mt-2 text-gray-700">{caseItem.description}</p>
              
              {caseItem.file && (
                <div className="mt-2 text-sm text-gray-500">
                  <FileText size={14} className="inline mr-1" />
                  Arquivo anexado: {caseItem.file.name}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {viewingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">{viewingFile.name}</h3>
              <button
                onClick={closeViewer}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <iframe
                src={viewingFile.url}
                className="w-full h-full min-h-[60vh]"
                title="Visualização do arquivo"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CaseList;