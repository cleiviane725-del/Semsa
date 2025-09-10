import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Wrench, Calendar, Truck, AlertTriangle, ArrowDown, ArrowUp,
  Edit, ChevronLeft, List, Activity, Package, Thermometer
} from 'lucide-react';
import { useMedication } from '../hooks/useMedication';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { differenceInDays } from 'date-fns';

const UtensilDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { 
    utensils, 
    locations, 
    stock, 
    transactions,
    getUtensilById, 
    updateUtensil,
    addStockTransaction,
    getLocationById
  } = useMedication();

  const [utensil, setUtensil] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showReportDamageModal, setShowReportDamageModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  
  const [editedUtensil, setEditedUtensil] = useState<any>(null);
  const [damageReport, setDamageReport] = useState({
    quantity: 0,
    reason: '',
    locationId: user?.role === 'admin' ? 'warehouse1' : user?.ubsId || '',
  });
  const [receiveStock, setReceiveStock] = useState({
    quantity: 0,
    reason: '',
  });
  const [distributeStock, setDistributeStock] = useState({
    quantity: 0,
    reason: '',
    destinationId: '',
  });

  useEffect(() => {
    if (id) {
      const ut = getUtensilById(id);
      if (ut) {
        setUtensil(ut);
        setEditedUtensil(ut);
      }
    }
  }, [id, utensils, getUtensilById]);

  if (!utensil) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-gray-500">Carregando...</div>
      </div>
    );
  }

  const totalStock = stock
    .filter(item => item.itemId === utensil.id && item.itemType === 'utensil')
    .reduce((sum, item) => sum + item.quantity, 0);
  
  const stockByLocation = locations.map(location => {
    const stockItem = stock.find(
      item => item.itemId === utensil.id && item.itemType === 'utensil' && item.locationId === location.id
    );
    return {
      locationId: location.id,
      locationName: location.name,
      quantity: stockItem ? stockItem.quantity : 0,
    };
  });
  
  const relevantTransactions = transactions
    .filter(t => t.itemId === utensil.id && t.itemType === 'utensil')
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
    .slice(0, 10);
  
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
  
  const isLowStock = totalStock <= utensil.minimumStock;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedUtensil(prev => ({
      ...prev,
      [name]: 
        name === 'quantity' || name === 'minimumStock' 
          ? parseInt(value) || 0 
          : value,
    }));
  };

  const handleSaveEdit = () => {
    if (editedUtensil) {
      updateUtensil(editedUtensil);
      setUtensil(editedUtensil);
      setIsEditing(false);
      
      addNotification({
        type: 'success',
        title: 'Utensílio Atualizado',
        message: `${editedUtensil.name} foi atualizado com sucesso.`,
      });
    }
  };

  const handleDamageReportChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDamageReport(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value,
    }));
  };

  const handleReceiveStockChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReceiveStock(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value,
    }));
  };

  const handleDistributeStockChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDistributeStock(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value,
    }));
  };

  const handleReportDamage = () => {
    if (damageReport.quantity <= 0 || !damageReport.reason) return;
    
    addStockTransaction({
      type: 'damaged',
      sourceLocationId: damageReport.locationId,
      destinationLocationId: null,
      itemId: utensil.id,
      itemType: 'utensil',
      quantity: damageReport.quantity,
      reason: damageReport.reason,
      status: 'completed',
    });
    
    addNotification({
      type: 'warning',
      title: 'Utensílio Avariado',
      message: `${damageReport.quantity} unidades de ${utensil.name} foram registradas como avariadas.`,
    });
    
    setShowReportDamageModal(false);
    setDamageReport({
      quantity: 0,
      reason: '',
      locationId: user?.role === 'admin' ? 'warehouse1' : user?.ubsId || '',
    });
  };

  const handleReceiveStock = () => {
    if (receiveStock.quantity <= 0 || !receiveStock.reason) return;
    
    addStockTransaction({
      type: 'receipt',
      sourceLocationId: null,
      destinationLocationId: 'warehouse1',
      itemId: utensil.id,
      itemType: 'utensil',
      quantity: receiveStock.quantity,
      reason: receiveStock.reason,
      status: 'completed',
    });
    
    addNotification({
      type: 'success',
      title: 'Estoque Recebido',
      message: `${receiveStock.quantity} unidades de ${utensil.name} foram adicionadas ao estoque.`,
    });
    
    setShowReceiveModal(false);
    setReceiveStock({
      quantity: 0,
      reason: '',
    });
  };

  const handleDistributeStock = () => {
    if (
      distributeStock.quantity <= 0 || 
      !distributeStock.reason || 
      !distributeStock.destinationId
    ) return;
    
    const sourceLocationId = user?.role === 'admin' ? 'warehouse1' : user?.ubsId;
    if (!sourceLocationId) return;
    
    // Check if we have enough stock
    const sourceLocation = stock.find(
      item => item.itemId === utensil.id && item.itemType === 'utensil' && item.locationId === sourceLocationId
    );
    
    if (!sourceLocation || sourceLocation.quantity < distributeStock.quantity) {
      addNotification({
        type: 'error',
        title: 'Estoque Insuficiente',
        message: `Não há estoque suficiente para realizar esta distribuição.`,
      });
      return;
    }
    
    addStockTransaction({
      type: 'distribution',
      sourceLocationId,
      destinationLocationId: distributeStock.destinationId,
      itemId: utensil.id,
      itemType: 'utensil',
      quantity: distributeStock.quantity,
      reason: distributeStock.reason,
      status: user?.role === 'admin' ? 'completed' : 'pending',
    });
    
    addNotification({
      type: 'info',
      title: user?.role === 'admin' ? 'Distribuição Realizada' : 'Solicitação Enviada',
      message: user?.role === 'admin' 
        ? `${distributeStock.quantity} unidades de ${utensil.name} foram distribuídas.`
        : `Solicitação de ${distributeStock.quantity} unidades de ${utensil.name} foi enviada para aprovação.`,
    });
    
    setShowDistributeModal(false);
    setDistributeStock({
      quantity: 0,
      reason: '',
      destinationId: '',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/utensils')}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Detalhes do Utensílio</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">{utensil.name}</h2>
                {isExpired ? (
                  <span className="badge bg-danger-100 text-danger-800">Vencido</span>
                ) : isLowStock ? (
                  <span className="badge bg-warning-100 text-warning-800">Estoque Baixo</span>
                ) : (
                  <span className="badge bg-success-100 text-success-800">Disponível</span>
                )}
              </div>
              <p className="text-gray-600 mt-1">{utensil.manufacturer}</p>
            </div>
            {user?.role === 'admin' && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn-secondary flex items-center gap-1"
              >
                <Edit size={16} />
                <span>{isEditing ? 'Cancelar' : 'Editar'}</span>
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nome
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editedUtensil.name}
                    onChange={handleInputChange}
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fabricante
                  </label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={editedUtensil.manufacturer}
                    onChange={handleInputChange}
                    className="input mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Lote
                  </label>
                  <input
                    type="text"
                    name="batch"
                    value={editedUtensil.batch}
                    onChange={handleInputChange}
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Data de Validade
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={editedUtensil.expiryDate ? editedUtensil.expiryDate.split('T')[0] : ''}
                    onChange={handleInputChange}
                    className="input mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    name="minimumStock"
                    value={editedUtensil.minimumStock}
                    onChange={handleInputChange}
                    className="input mt-1"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tipo de Armazenamento
                  </label>
                  <select
                    name="storageType"
                    value={editedUtensil.storageType}
                    onChange={handleInputChange}
                    className="select mt-1"
                  >
                    <option value="room">Temperatura Ambiente</option>
                    <option value="refrigerated">Refrigerado</option>
                    <option value="controlled">Controlado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Categoria
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={editedUtensil.category}
                    onChange={handleInputChange}
                    className="input mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={handleSaveEdit}
                  className="btn-primary"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="text-primary-600" size={18} />
                    <span className="text-sm font-medium text-gray-600">Lote</span>
                  </div>
                  <p className="text-lg font-medium">{utensil.batch}</p>
                </div>

                {utensil.expiryDate && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="text-primary-600" size={18} />
                      <span className="text-sm font-medium text-gray-600">Validade</span>
                    </div>
                    <p className={`text-lg font-medium ${
                      isExpired ? 'text-danger-600' : isExpiringSoon ? 'text-warning-600' : ''
                    }`}>
                      {new Date(utensil.expiryDate).toLocaleDateString()}
                      {(isExpired || isExpiringSoon) && (
                        <span className="block text-sm">
                          {isExpired 
                            ? 'Vencido' 
                            : `${daysUntilExpiry} dias restantes`}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {utensil.storageType === 'room' ? (
                      <Package className="text-primary-600" size={18} />
                    ) : utensil.storageType === 'refrigerated' ? (
                      <Thermometer className="text-primary-600" size={18} />
                    ) : (
                      <Wrench className="text-primary-600" size={18} />
                    )}
                    <span className="text-sm font-medium text-gray-600">Armazenamento</span>
                  </div>
                  <p className="text-lg font-medium">
                    {utensil.storageType === 'room'
                      ? 'Temperatura Ambiente'
                      : utensil.storageType === 'refrigerated'
                      ? 'Refrigerado'
                      : 'Controlado'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Estoque Total: {totalStock} unidades</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead className="bg-gray-100">
                        <tr>
                          <th>Local</th>
                          <th>Quantidade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockByLocation
                          .filter(item => item.quantity > 0)
                          .map(item => (
                            <tr key={item.locationId}>
                              <td>{item.locationName}</td>
                              <td>{item.quantity}</td>
                            </tr>
                          ))}
                        {stockByLocation.filter(item => item.quantity > 0).length === 0 && (
                          <tr>
                            <td colSpan={2} className="text-center text-gray-500 py-4">
                              Sem estoque disponível
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="text-lg font-medium mb-4">Ações</h3>
            <div className="space-y-3">
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowReceiveModal(true)}
                  className="w-full btn-success flex items-center justify-center gap-2"
                >
                  <ArrowDown size={18} />
                  <span>Receber no Estoque</span>
                </button>
              )}
              <button
                onClick={() => setShowDistributeModal(true)}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <Truck size={18} />
                <span>
                  {user?.role === 'admin' ? 'Distribuir para UBS' : 'Solicitar ao Almoxarifado'}
                </span>
              </button>
              <button
                onClick={() => setShowReportDamageModal(true)}
                className="w-full btn-warning flex items-center justify-center gap-2"
              >
                <AlertTriangle size={18} />
                <span>Reportar Avaria</span>
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="flex items-center gap-2 text-lg font-medium mb-4">
              <Activity size={18} className="text-primary-600" />
              <span>Últimas Movimentações</span>
            </h3>
            {relevantTransactions.length > 0 ? (
              <div className="space-y-3">
                {relevantTransactions.map(transaction => {
                  const sourceLocation = transaction.sourceLocationId
                    ? getLocationById(transaction.sourceLocationId)?.name
                    : null;
                  const destinationLocation = transaction.destinationLocationId
                    ? getLocationById(transaction.destinationLocationId)?.name
                    : null;

                  return (
                    <div
                      key={transaction.id}
                      className="p-3 border rounded-lg text-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {transaction.type === 'receipt' ? (
                            <ArrowDown className="text-success-500" size={16} />
                          ) : transaction.type === 'distribution' ? (
                            <Truck className="text-primary-500" size={16} />
                          ) : transaction.type === 'damaged' ? (
                            <AlertTriangle className="text-warning-500" size={16} />
                          ) : (
                            <ArrowUp className="text-primary-500" size={16} />
                          )}
                          <div>
                            <p className="font-medium">
                              {transaction.type === 'receipt'
                                ? 'Recebimento'
                                : transaction.type === 'distribution'
                                ? 'Distribuição'
                                : transaction.type === 'damaged'
                                ? 'Avaria'
                                : 'Dispensação'}
                            </p>
                            <p className="text-gray-600">
                              {transaction.type === 'receipt'
                                ? `Entrada de ${transaction.quantity} unidades`
                                : transaction.type === 'distribution'
                                ? `${sourceLocation} → ${destinationLocation}`
                                : transaction.type === 'damaged'
                                ? `${transaction.quantity} unidades avariadas`
                                : `${transaction.quantity} unidades dispensadas`}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`badge ${
                            transaction.status === 'pending'
                              ? 'bg-warning-100 text-warning-800'
                              : transaction.status === 'approved' || transaction.status === 'completed'
                              ? 'bg-success-100 text-success-800'
                              : 'bg-danger-100 text-danger-800'
                          }`}
                        >
                          {transaction.status === 'pending'
                            ? 'Pendente'
                            : transaction.status === 'approved'
                            ? 'Aprovado'
                            : transaction.status === 'completed'
                            ? 'Concluído'
                            : 'Rejeitado'}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(transaction.requestDate).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Nenhuma movimentação registrada
              </p>
            )}
            {relevantTransactions.length > 0 && (
              <div className="mt-3 text-center">
                <button className="text-primary-600 text-sm font-medium flex items-center gap-1 mx-auto">
                  <List size={16} />
                  <span>Ver todas as movimentações</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Damage Modal */}
      {showReportDamageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md mx-auto p-6 w-full">
            <h3 className="text-xl font-bold mb-4">Reportar Utensílio Avariado</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Local
                </label>
                <select
                  name="locationId"
                  value={damageReport.locationId}
                  onChange={handleDamageReportChange}
                  className="select mt-1"
                  disabled={user?.role !== 'admin'}
                >
                  {locations
                    .filter(loc => 
                      user?.role === 'admin' || loc.id === user?.ubsId
                    )
                    .map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantidade Avariada
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={damageReport.quantity}
                  onChange={handleDamageReportChange}
                  className="input mt-1"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Motivo
                </label>
                <textarea
                  name="reason"
                  value={damageReport.reason}
                  onChange={handleDamageReportChange}
                  className="input mt-1"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowReportDamageModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReportDamage}
                  className="btn-warning"
                  disabled={damageReport.quantity <= 0 || !damageReport.reason}
                >
                  Reportar Avaria
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receive Stock Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md mx-auto p-6 w-full">
            <h3 className="text-xl font-bold mb-4">Receber Utensílio no Estoque</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantidade a Receber
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={receiveStock.quantity}
                  onChange={handleReceiveStockChange}
                  className="input mt-1"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Motivo / Origem
                </label>
                <textarea
                  name="reason"
                  value={receiveStock.reason}
                  onChange={handleReceiveStockChange}
                  className="input mt-1"
                  rows={3}
                  placeholder="Ex: Compra mensal, doação, transferência..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowReceiveModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReceiveStock}
                  className="btn-success"
                  disabled={receiveStock.quantity <= 0 || !receiveStock.reason}
                >
                  Receber no Estoque
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distribute Stock Modal */}
      {showDistributeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md mx-auto p-6 w-full">
            <h3 className="text-xl font-bold mb-4">
              {user?.role === 'admin' 
                ? 'Distribuir Utensílio para UBS' 
                : 'Solicitar Utensílio ao Almoxarifado'}
            </h3>
            <div className="space-y-4">
              {user?.role === 'admin' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    UBS de Destino
                  </label>
                  <select
                    name="destinationId"
                    value={distributeStock.destinationId}
                    onChange={handleDistributeStockChange}
                    className="select mt-1"
                  >
                    <option value="">Selecione uma UBS</option>
                    {locations
                      .filter(loc => loc.type === 'ubs')
                      .map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <input
                  type="hidden"
                  name="destinationId"
                  value={distributeStock.destinationId = user?.ubsId || ''}
                />
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantidade
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={distributeStock.quantity}
                  onChange={handleDistributeStockChange}
                  className="input mt-1"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Motivo da Solicitação
                </label>
                <textarea
                  name="reason"
                  value={distributeStock.reason}
                  onChange={handleDistributeStockChange}
                  className="input mt-1"
                  rows={3}
                  placeholder="Ex: Distribuição mensal, reposição de estoque..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDistributeModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDistributeStock}
                  className="btn-primary"
                  disabled={
                    distributeStock.quantity <= 0 || 
                    !distributeStock.reason || 
                    (user?.role === 'admin' && !distributeStock.destinationId)
                  }
                >
                  {user?.role === 'admin' ? 'Distribuir' : 'Solicitar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UtensilDetail;