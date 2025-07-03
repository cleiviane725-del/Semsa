import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Pill, Package, Thermometer, AlertTriangle, Check, X, Eye } from 'lucide-react';
import { useMedication } from '../hooks/useMedication';
import { useAuth } from '../hooks/useAuth';
import { differenceInDays } from 'date-fns';

const MedicationList = () => {
  const { medications, stock, getTotalStock } = useMedication();
  const { userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: '',
    manufacturer: '',
    batch: '',
    expiryDate: '',
    quantity: 0,
    minimumStock: 0,
    storageType: 'room',
    category: '',
  });

  const [filteredMedications, setFilteredMedications] = useState(medications);

  useEffect(() => {
    let result = [...medications];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        med =>
          med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          med.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          med.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          med.batch.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (filter !== 'all') {
      if (filter === 'low-stock') {
        result = result.filter(med => {
          const totalStock = getTotalStock(med.id);
          return totalStock <= med.minimumStock;
        });
      } else if (filter === 'expiring-soon') {
        result = result.filter(med => {
          const daysUntilExpiry = differenceInDays(
            new Date(med.expiryDate),
            new Date()
          );
          return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
        });
      } else if (filter === 'expired') {
        result = result.filter(med => {
          return new Date(med.expiryDate) < new Date();
        });
      } else {
        result = result.filter(med => med.storageType === filter);
      }
    }

    setFilteredMedications(result);
  }, [medications, searchTerm, filter, getTotalStock]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewMedication(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'minimumStock' ? parseInt(value) || 0 : value,
    }));
  };

  const { addMedication } = useMedication();

  const handleAddMedication = () => {
    // Validate form
    if (
      !newMedication.name ||
      !newMedication.manufacturer ||
      !newMedication.batch ||
      !newMedication.expiryDate ||
      newMedication.quantity <= 0 ||
      newMedication.minimumStock < 0 ||
      !newMedication.category
    ) {
      return;
    }

    // Add new medication
    addMedication(newMedication);

    // Reset form and close modal
    setNewMedication({
      name: '',
      manufacturer: '',
      batch: '',
      expiryDate: '',
      quantity: 0,
      minimumStock: 0,
      storageType: 'room',
      category: '',
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Medicamentos</h1>
        {userRole === 'admin' && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            <span>Adicionar Medicamento</span>
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar medicamentos..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="select"
          >
            <option value="all">Todos</option>
            <option value="room">Temperatura Ambiente</option>
            <option value="refrigerated">Refrigerados</option>
            <option value="controlled">Controlados</option>
            <option value="low-stock">Estoque Baixo</option>
            <option value="expiring-soon">A Vencer</option>
            <option value="expired">Vencidos</option>
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
                <th scope="col">Nome</th>
                <th scope="col">Fabricante</th>
                <th scope="col">Lote</th>
                <th scope="col">Validade</th>
                <th scope="col">Estoque</th>
                <th scope="col">Categoria</th>
                <th scope="col">Tipo</th>
                <th scope="col">Status</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedications.map(medication => {
                const totalStock = getTotalStock(medication.id);
                const isLowStock = totalStock <= medication.minimumStock;
                const daysUntilExpiry = differenceInDays(
                  new Date(medication.expiryDate),
                  new Date()
                );
                const isExpired = daysUntilExpiry < 0;
                const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 30;

                return (
                  <tr key={medication.id}>
                    <td className="font-medium">{medication.name}</td>
                    <td>{medication.manufacturer}</td>
                    <td>{medication.batch}</td>
                    <td>
                      <span
                        className={
                          isExpired
                            ? 'text-danger-600'
                            : isExpiringSoon
                            ? 'text-warning-600'
                            : ''
                        }
                      >
                        {new Date(medication.expiryDate).toLocaleDateString()}
                        {isExpired && (
                          <span className="ml-2 text-xs text-danger-600">
                            Vencido
                          </span>
                        )}
                        {isExpiringSoon && !isExpired && (
                          <span className="ml-2 text-xs text-warning-600">
                            {daysUntilExpiry} dias
                          </span>
                        )}
                      </span>
                    </td>
                    <td>
                      <span
                        className={isLowStock ? 'text-danger-600 font-medium' : ''}
                      >
                        {totalStock}
                        {isLowStock && (
                          <span className="ml-2 text-xs bg-danger-100 text-danger-800 px-1.5 py-0.5 rounded">
                            Baixo
                          </span>
                        )}
                      </span>
                    </td>
                    <td>{medication.category}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        {medication.storageType === 'room' ? (
                          <Package size={16} className="text-gray-500" />
                        ) : medication.storageType === 'refrigerated' ? (
                          <Thermometer size={16} className="text-primary-500" />
                        ) : (
                          <Pill size={16} className="text-warning-500" />
                        )}
                        <span>
                          {medication.storageType === 'room'
                            ? 'Ambiente'
                            : medication.storageType === 'refrigerated'
                            ? 'Refrigerado'
                            : 'Controlado'}
                        </span>
                      </div>
                    </td>
                    <td>
                      {isExpired ? (
                        <span className="badge bg-danger-100 text-danger-800 flex items-center gap-1">
                          <X size={12} />
                          Vencido
                        </span>
                      ) : isLowStock ? (
                        <span className="badge bg-warning-100 text-warning-800 flex items-center gap-1">
                          <AlertTriangle size={12} />
                          Estoque Baixo
                        </span>
                      ) : (
                        <span className="badge bg-success-100 text-success-800 flex items-center gap-1">
                          <Check size={12} />
                          Normal
                        </span>
                      )}
                    </td>
                    <td>
                      <Link
                        to={`/medications/${medication.id}`}
                        className="text-primary-600 hover:text-primary-800 flex items-center gap-1"
                      >
                        <Eye size={16} />
                        <span>Detalhes</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredMedications.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-4 text-gray-500">
                    Nenhum medicamento encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Medication Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md mx-auto p-6 w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Adicionar Novo Medicamento</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome do Medicamento
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newMedication.name}
                  onChange={handleInputChange}
                  className="input mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700">
                    Fabricante
                  </label>
                  <input
                    type="text"
                    id="manufacturer"
                    name="manufacturer"
                    value={newMedication.manufacturer}
                    onChange={handleInputChange}
                    className="input mt-1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Categoria
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={newMedication.category}
                    onChange={handleInputChange}
                    className="input mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="batch" className="block text-sm font-medium text-gray-700">
                    Lote
                  </label>
                  <input
                    type="text"
                    id="batch"
                    name="batch"
                    value={newMedication.batch}
                    onChange={handleInputChange}
                    className="input mt-1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
                    Data de Validade
                  </label>
                  <input
                    type="date"
                    id="expiryDate"
                    name="expiryDate"
                    value={newMedication.expiryDate}
                    onChange={handleInputChange}
                    className="input mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Quantidade Inicial
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={newMedication.quantity}
                    onChange={handleInputChange}
                    className="input mt-1"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="minimumStock" className="block text-sm font-medium text-gray-700">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    id="minimumStock"
                    name="minimumStock"
                    value={newMedication.minimumStock}
                    onChange={handleInputChange}
                    className="input mt-1"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="storageType" className="block text-sm font-medium text-gray-700">
                  Tipo de Armazenamento
                </label>
                <select
                  id="storageType"
                  name="storageType"
                  value={newMedication.storageType}
                  onChange={handleInputChange}
                  className="select mt-1"
                  required
                >
                  <option value="room">Temperatura Ambiente</option>
                  <option value="refrigerated">Refrigerado</option>
                  <option value="controlled">Controlado</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="btn-primary"
                >
                  Adicionar Medicamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationList;