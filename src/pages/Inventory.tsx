import { useState, useEffect } from 'react';
import { Package, Search, Filter, Plus, ArrowDown, ArrowUp, AlertTriangle, Check, X, Truck, Bell } from 'lucide-react';
import { useMedication } from '../hooks/useMedication';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';

const Inventory = () => {
  const { medications, stock, transactions, locations, updateTransactionStatus } = useMedication();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('approved');
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);

  useEffect(() => {
    // Get only distribution transactions
    let relevantTransactions = transactions.filter(t => 
      t.type === 'distribution' && 
      t.sourceLocationId === 'warehouse1'
    );

    // Apply search filter
    if (searchTerm) {
      relevantTransactions = relevantTransactions.filter(t => {
        const medication = medications.find(m => m.id === t.medicationId);
        const destinationLocation = locations.find(l => l.id === t.destinationLocationId);
        
        return (
          medication?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          destinationLocation?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.reason.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      relevantTransactions = relevantTransactions.filter(t => t.status === statusFilter);
    }

    // Sort by request date (newest first)
    relevantTransactions.sort((a, b) => 
      new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
    );

    setFilteredTransactions(relevantTransactions);
  }, [transactions, searchTerm, statusFilter, medications, locations]);

  const handleProcessTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowProcessModal(true);
  };

  const handleComplete = () => {
    if (!selectedTransaction || !user?.id) return;

    updateTransactionStatus(selectedTransaction.id, 'completed', user.id);
    
    addNotification({
      type: 'success',
      title: 'Distribuição Concluída',
      message: `A distribuição foi liberada e processada com sucesso. O estoque foi atualizado automaticamente.`,
    });
    
    setShowProcessModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Controle de Estoque</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar solicitações..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="select"
          >
            <option value="all">Todos os Status</option>
            <option value="approved">Aprovados</option>
            <option value="completed">Concluídos</option>
          </select>
          <button className="btn-secondary flex items-center gap-2">
            <Filter size={18} />
            <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col">Medicamento</th>
                <th scope="col">UBS Destino</th>
                <th scope="col">Quantidade</th>
                <th scope="col">Data da Aprovação</th>
                <th scope="col">Status</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(transaction => {
                const medication = medications.find(m => m.id === transaction.medicationId);
                const destinationLocation = locations.find(l => l.id === transaction.destinationLocationId);

                return (
                  <tr key={transaction.id}>
                    <td className="font-medium">{medication?.name || 'Desconhecido'}</td>
                    <td>{destinationLocation?.name || 'N/A'}</td>
                    <td>{transaction.quantity}</td>
                    <td>{new Date(transaction.processDate || transaction.requestDate).toLocaleDateString()}</td>
                    <td>
                      {transaction.status === 'approved' ? (
                        <span className="badge bg-primary-100 text-primary-800">Aprovado</span>
                      ) : (
                        <span className="badge bg-success-100 text-success-800">Concluído</span>
                      )}
                    </td>
                    <td>
                      {transaction.status === 'approved' && (
                        <button
                          onClick={() => handleProcessTransaction(transaction)}
                          className="text-primary-600 hover:text-primary-800 flex items-center gap-1"
                        >
                          <Truck size={16} />
                          <span>Processar</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    Nenhuma solicitação encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Transaction Modal */}
      {showProcessModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-lg mx-auto p-6 w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Processar Distribuição</h3>
              <button
                onClick={() => setShowProcessModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Medicamento</p>
                <p className="font-medium">
                  {medications.find(m => m.id === selectedTransaction.medicationId)?.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">UBS Destino</p>
                  <p className="font-medium">
                    {locations.find(l => l.id === selectedTransaction.destinationLocationId)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Quantidade</p>
                  <p className="font-medium">{selectedTransaction.quantity}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Motivo da Solicitação</p>
                <p className="font-medium">{selectedTransaction.reason}</p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowProcessModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleComplete}
                  className="btn-primary flex items-center gap-2"
                >
                  <Check size={18} />
                  <span>Confirmar Envio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;