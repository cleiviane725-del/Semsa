import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, Calendar, Truck, AlertTriangle, ArrowDown, ArrowUp,
  Edit, ChevronLeft, List, Activity, Pill, Thermometer
} from 'lucide-react';
import { useMedication } from '../hooks/useMedication';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { differenceInDays } from 'date-fns';

const MedicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { 
    medications, 
    locations, 
    stock, 
    transactions,
    getMedicationById, 
    updateMedication,
    addStockTransaction,
    getLocationById
  } = useMedication();

  const [medication, setMedication] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showReportDamageModal, setShowReportDamageModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  
  const [editedMedication, setEditedMedication] = useState<any>(null);
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
      const med = getMedicationById(id);
      if (med) {
        setMedication(med);
        setEditedMedication(med);
      }
    }
  }, [id, medications, getMedicationById]);

  if (!medication) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-gray-500">Carregando...</div>
      </div>
    );
  }

  const totalStock = stock
    .filter(item => item.medicationId === medication.id)
    .reduce((sum, item) => sum + item.quantity, 0);
  
  const stockByLocation = locations.map(location => {
    const stockItem = stock.find(
      item => item.medicationId === medication.id && item.locationId === location.id
    );
    return {
      locationId: location.id,
      locationName: location.name,
      quantity: stockItem ? stockItem.quantity : 0,
    };
  });
  
  const relevantTransactions = transactions
    .filter(t => t.medicationId === medication.id)
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
    .slice(0, 10);
  
  const daysUntilExpiry = differenceInDays(
    new Date(medication.expiryDate),
    new Date()
  );
  
  const isLowStock = totalStock <= medication.minimumStock;
  const isExpired = daysUntilExpiry < 0;
  const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 30;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedMedication(prev => ({
      ...prev,
      [name]: 
        name === 'quantity' || name === 'minimumStock' 
          ? parseInt(value) || 0 
          : value,
    }));
  };

  const handleSaveEdit = () => {
    if (editedMedication) {
      updateMedication(editedMedication);
      setMedication(editedMedication);
      setIsEditing(false);
      
      addNotification({
        type: 'success',
        title: 'Medicamento Atualizado',
        message: `${editedMedication.name} foi atualizado com sucesso.`,
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
      medicationId: medication.id,
      quantity: damageReport.quantity,
      reason: damageReport.reason,
      status: 'completed',
    });
    
    addNotification({
      type: 'warning',
      title: 'Medicamento Avariado',
      message: `${damageReport.quantity} unidades de ${medication.name} foram registradas como avariadas.`,
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
      medicationId: medication.id,
      quantity: receiveStock.quantity,
      reason: receiveStock.reason,
      status: 'completed',
    });
    
    addNotification({
      type: 'success',
      title: 'Estoque Recebido',
      message: `${receiveStock.quantity} unidades de ${medication.name} foram recebidas e adicionadas ao estoque do almoxarifado.`,
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
      item => item.medicationId === medication.id && item.locationId === sourceLocationId
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
      medicationId: medication.id,
      quantity: distributeStock.quantity,
      reason: distributeStock.reason,
      status: user?.role === 'admin' ? 'completed' : 'pending',
    });
    
    addNotification({
      type: 'info',
      title: user?.role === 'admin' ? 'Distribuição Realizada' : 'Solicitação Enviada',
      message: user?.role === 'admin' 
        ? `${distributeStock.quantity} unidades de ${medication.name} foram distribuídas.`
        : `Solicitação de ${distributeStock.quantity} unidades de ${medication.name} foi enviada para aprovação.`,
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
          onClick={() => navigate('/medications')}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Detalhes do Medicamento</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">{medication.name}</h2>
                {isExpired ? (
                  <span className="badge bg-danger-100 text-danger-800">Vencido</span>
                ) : isLowStock ? (
                  <span className="badge bg-warning-100 text-warning-800">Estoque Baixo</span>
                ) : (
                  <span className="badge bg-success-100 text-success-800">Disponível</span>
                )}
              </div>
              <p className="text-gray-600 mt-1">{medication.manufacturer}</p>
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
                    value={editedMedication.name}
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
                    value={editedMedication.manufacturer}
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
                    value={editedMedication.batch}
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
                    value={editedMedication.expiryDate.split('T')[0]}
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
                    value={editedMedication.minimumStock}
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
                    value={editedMedication.storageType}
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
                    value={editedMedication.category}
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
                  <p className="text-lg font-medium">{medication.batch}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="text-primary-600" size={18} />
                    <span className="text-sm font-medium text-gray-600">Validade</span>
                  </div>
                  <p className={`text-lg font-medium ${
                    isExpired ? 'text-danger-600' : isExpiringSoon ? 'text-warning-600' : ''
                  }`}>
                    {new Date(medication.expiryDate).toLocaleDateString()}
                    {(isExpired || isExpiringSoon) && (
                      <span className="block text-sm">
                        {isExpired 
                          ? 'Vencido' 
                          : `${daysUntilExpiry} dias restantes`}
                      </span>
                    )}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {medication.storageType === 'room' ? (
                      <Package className="text-primary-600" size={18} />
                    ) : medication.storageType === 'refrigerated' ? (
                      <Thermometer className="text-primary-600" size={18} />
                    ) : (
                      <Pill className="text-primary-600" size={18} />
                    )}
                    <span className="text-sm font-medium text-gray-600">Armazenamento</span>
                  </div>
                  <p className="text-lg font-medium">
                    {medication.storageType === 'room'
                      ? 'Temperatura Ambiente'
                      : medication.storageType === 'refrigerated'
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
                  {user?.role === 'admin' ? 'Distribuir para UBS' : 'Solicitar ao Administrador'}
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
            <h3 className="text-xl font-bold mb-4">Reportar Medicamento Avariado</h3>
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
            <h3 className="text-xl font-bold mb-4">Receber Medicamento no Estoque</h3>
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
                ? 'Distribuir Medicamento para UBS'
                : 'Solicitar Medicamento ao Administrador'}
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
                  Motivo da Solicitação ao Administrador
                </label>
                <textarea
                  name="reason"
                  value={distributeStock.reason}
                  onChange={handleDistributeStockChange}
                  className="input mt-1"
                  rows={3}
                  placeholder="Ex: Estoque baixo na UBS, reposição urgente..."
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

export default MedicationDetail;