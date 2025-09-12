import { useState, useEffect } from 'react';
import { Truck, Search, Filter, Check, X, AlertTriangle } from 'lucide-react';
import { useMedication } from '../hooks/useMedication';
import { useAuth } from '../hooks/useAuth';

const DistributionList = () => {
  const { medications, locations, transactions, getMedicationById, getLocationById } = useMedication();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);

  useEffect(() => {
    // Get only distribution transactions
    let distributionTransactions = transactions.filter(t => t.type === 'distribution');

    // If pharmacist, only show transactions related to their UBS
    if (user?.role === 'pharmacist' && user.ubsId) {
      distributionTransactions = distributionTransactions.filter(
        t => t.sourceLocationId === user.ubsId || t.destinationLocationId === user.ubsId
      );
    }

    // Apply search filter
    if (searchTerm) {
      distributionTransactions = distributionTransactions.filter(t => {
        const medication = getMedicationById(t.itemId || t.medicationId);
        const sourceName = t.sourceLocationId ? getLocationById(t.sourceLocationId)?.name : '';
        const destinationName = t.destinationLocationId ? getLocationById(t.destinationLocationId)?.name : '';
        
        return (
          medication?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sourceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          destinationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.reason.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      distributionTransactions = distributionTransactions.filter(t => t.status === statusFilter);
    }

    // Sort by request date (newest first)
    distributionTransactions.sort((a, b) => 
      new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
    );

    setFilteredTransactions(distributionTransactions);
  }, [transactions, searchTerm, statusFilter, user, getMedicationById, getLocationById]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Distribuições</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar distribuições..."
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
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="completed">Concluídos</option>
            <option value="rejected">Rejeitados</option>
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
                <th scope="col">Origem</th>
                <th scope="col">Destino</th>
                <th scope="col">Quantidade</th>
                <th scope="col">Data da Solicitação</th>
                <th scope="col">Status</th>
                <th scope="col">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(transaction => {
                const medication = getMedicationById(transaction.itemId || transaction.medicationId);
                const sourceLocation = transaction.sourceLocationId 
                  ? getLocationById(transaction.sourceLocationId) 
                  : null;
                const destinationLocation = transaction.destinationLocationId
                  ? getLocationById(transaction.destinationLocationId)
                  : null;

                return (
                  <tr key={transaction.id}>
                    <td className="font-medium">{medication?.name || 'Desconhecido'}</td>
                    <td>{sourceLocation?.name || 'N/A'}</td>
                    <td>{destinationLocation?.name || 'N/A'}</td>
                    <td>{transaction.quantity}</td>
                    <td>{new Date(transaction.requestDate).toLocaleDateString()}</td>
                    <td>
                      {transaction.status === 'pending' ? (
                        <span className="flex items-center gap-1 text-warning-600">
                          <AlertTriangle size={16} />
                          <span>Pendente</span>
                        </span>
                      ) : transaction.status === 'approved' || transaction.status === 'completed' ? (
                        <span className="flex items-center gap-1 text-success-600">
                          <Check size={16} />
                          <span>
                            {transaction.status === 'approved' ? 'Aprovado' : 'Concluído'}
                          </span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-danger-600">
                          <X size={16} />
                          <span>Rejeitado</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="text-sm text-gray-600">{transaction.reason}</span>
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    Nenhuma distribuição encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DistributionList;