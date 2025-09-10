import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Wrench, Package, Thermometer, AlertTriangle, Check, X, Eye } from 'lucide-react';
import { useMedication } from '../hooks/useMedication';
import { useAuth } from '../hooks/useAuth';
import { differenceInDays } from 'date-fns';

const UtensilList = () => {
  const { utensils, stock, getTotalStock } = useMedication();
  const { userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [newUtensil, setNewUtensil] = useState({
    name: '',
    manufacturer: '',
    batch: '',
    expiryDate: '',
    quantity: 0,
    minimumStock: 0,
    storageType: 'room',
    category: '',
  });

  const [filteredUtensils, setFilteredUtensils] = useState(utensils);

  useEffect(() => {
    let result = [...utensils];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        utensil =>
          utensil.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          utensil.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          utensil.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          utensil.batch.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (filter !== 'all') {
      if (filter === 'low-stock') {
        result = result.filter(utensil => {
          const totalStock = getTotalStock(utensil.id, 'utensil');
          return totalStock <= utensil.minimumStock;
        });
      } else if (filter === 'expiring-soon') {
        result = result.filter(utensil => {
          if (!utensil.expiryDate) return false;
          const daysUntilExpiry = differenceInDays(
            new Date(utensil.expiryDate),
            new Date()
          );
          return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
        });
      } else if (filter === 'expired') {
        result = result.filter(utensil => {
          if (!utensil.expiryDate) return false;
          return new Date(utensil.expiryDate) < new Date();
        });
      } else {
        result = result.filter(utensil => utensil.storageType === filter);
      }
    }

    setFilteredUtensils(result);
  }, [utensils, searchTerm, filter, getTotalStock]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUtensil(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'minimumStock' ? parseInt(value) || 0 : value,
    }));
  };

  const { addUtensil } = useMedication();

  const handleAddUtensil = () => {
    // Validate form
    if (
      !newUtensil.name ||
      !newUtensil.manufacturer ||
      !newUtensil.batch ||
      newUtensil.quantity <= 0 ||
      newUtensil.minimumStock < 0 ||
      !newUtensil.category
    ) {
      return;
    }

    // Add new utensil
    addUtensil(newUtensil);

    // Reset form and close modal
    setNewUtensil({
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
        <h1 className="text-2xl font-bold text-gray-900">Utensílios</h1>
        {userRole === 'admin' && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            <span>Adicionar Utensílio</span>
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar utensílios..."
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
              {filteredUtensils.map(utensil => {
                const totalStock = getTotalStock(utensil.id, 'utensil');
                const isLowStock = totalStock <= utensil.minimumStock;
                let daysUntilExpiry = null;
                let isExpired = false;
                let isExpiringSoon = false;
                
                if (utensil.expiryDate) {
                  daysUntilExpiry = differenceInDays(
                    new Date(utensil.expiryDate),
                    new Date()
                  );
                  isExpired = daysUntilExpiry < 0;
                  isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
                }

                return (
                  <tr key={utensil.id}>
                    <td className="font-medium">{utensil.name}</td>
                    <td>{utensil.manufacturer}</td>
                    <td>{utensil.batch}</td>
                    <td>
                      {utensil.expiryDate ? (
                        <span
                          className={
                            isExpired
                              ? 'text-danger-600'
                              : isExpiringSoon
                              ? 'text-warning-600'
                              : ''
                          }
                        >
                          {new Date(utensil.expiryDate).toLocaleDateString()}
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
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
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
                    <td>{utensil.category}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        {utensil.storageType === 'room' ? (
                          <Package size={16} className="text-gray-500" />
                        ) : utensil.storageType === 'refrigerated' ? (
                          <Thermometer size={16} className="text-primary-500" />
                        ) : (
                          <Wrench size={16} className="text-warning-500" />
                        )}
                        <span>
                          {utensil.storageType === 'room'
                            ? 'Ambiente'
                            : utensil.storageType === 'refrigerated'
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
                        to={`/utensils/${utensil.id}`}
                        className="text-primary-600 hover:text-primary-800 flex items-center gap-1"
                      >
                        <Eye size={16} />
                        <span>Detalhes</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredUtensils.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-4 text-gray-500">
                    Nenhum utensílio encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Utensil Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md mx-auto p-6 w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Adicionar Novo Utensílio</h3>
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
                  Nome do Utensílio
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newUtensil.name}
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
                    value={newUtensil.manufacturer}
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
                    value={newUtensil.category}
                    onChange={handleInputChange}
                    className="input mt-1"
                    placeholder="Ex: Descartáveis, Instrumentais"
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
                    value={newUtensil.batch}
                    onChange={handleInputChange}
                    className="input mt-1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
                    Data de Validade (opcional)
                  </label>
                  <input
                    type="date"
                    id="expiryDate"
                    name="expiryDate"
                    value={newUtensil.expiryDate}
                    onChange={handleInputChange}
                    className="input mt-1"
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
                    value={newUtensil.quantity}
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
                    value={newUtensil.minimumStock}
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
                  value={newUtensil.storageType}
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
                  onClick={handleAddUtensil}
                  className="btn-primary"
                >
                  Adicionar Utensílio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UtensilList;