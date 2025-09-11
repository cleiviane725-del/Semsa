import { useState, useEffect } from 'react';
import { Users, Search, Package, Calendar, User, Badge, AlertTriangle, Pill, Thermometer } from 'lucide-react';
import { useMedication } from '../hooks/useMedication';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { differenceInDays } from 'date-fns';

const PatientDistribution = () => {
  const { medications, stock, addStockTransaction } = useMedication();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<any>(null);
  const [filteredMedications, setFilteredMedications] = useState<any[]>([]);
  
  const [patientInfo, setPatientInfo] = useState({
    id: '',
    name: '',
    quantity: 0,
    notes: '',
  });

  useEffect(() => {
    if (!user?.ubsId) return;
    
    // Get all medications available at this UBS
    const availableMedications = medications.filter(med => {
      const stockItem = stock.find(
        item => item.medicationId === med.id && item.locationId === user.ubsId
      );
      return stockItem && stockItem.quantity > 0;
    });
    
    // Apply search filter
    if (searchTerm) {
      const filtered = availableMedications.filter(med => 
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMedications(filtered);
    } else {
      setFilteredMedications(availableMedications);
    }
  }, [medications, stock, searchTerm, user]);

  const handleSelectMedication = (medication: any) => {
    setSelectedMedication(medication);
    setShowModal(true);
    setPatientInfo({
      id: '',
      name: '',
      quantity: 1,
      notes: '',
    });
  };

  const handlePatientInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPatientInfo(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value,
    }));
  };

  const handleDistributeToPatient = () => {
    if (
      !selectedMedication || 
      !user?.ubsId || 
      !patientInfo.id || 
      !patientInfo.name || 
      patientInfo.quantity <= 0
    ) {
      return;
    }
    
    // Check if we have enough stock
    const stockItem = stock.find(
      item => item.medicationId === selectedMedication.id && item.locationId === user.ubsId
    );
    
    if (!stockItem || stockItem.quantity < patientInfo.quantity) {
      addNotification({
        type: 'error',
        title: 'Estoque Insuficiente',
        message: `Não há estoque suficiente de ${selectedMedication.name} para realizar esta dispensação.`,
      });
      return;
    }
    
    // Create transaction
    addStockTransaction({
      type: 'patient',
      sourceLocationId: user.ubsId,
      destinationLocationId: null,
      medicationId: selectedMedication.id,
      quantity: patientInfo.quantity,
      reason: `Dispensação para paciente: ${patientInfo.name}`,
      patientId: patientInfo.id,
      patientName: patientInfo.name,
      status: 'completed',
    });
    
    addNotification({
      type: 'success',
      title: 'Medicamento Dispensado',
      message: `${patientInfo.quantity} unidades de ${selectedMedication.name} foram dispensadas para ${patientInfo.name}.`,
    });
    
    setShowModal(false);
  };

  const getAvailableQuantity = (medicationId: string) => {
    if (!user?.ubsId) return 0;
    
    const stockItem = stock.find(
      item => item.itemId === medicationId && item.itemType === 'medication' && item.locationId === user.ubsId
    );
    
    return stockItem ? stockItem.quantity : 0;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispensação para Pacientes</h1>
          <p className="text-gray-600 mt-1">Selecione um medicamento disponível para dispensar ao paciente</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por nome, fabricante ou categoria..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Package size={16} />
          <span>{filteredMedications.length} medicamentos disponíveis</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMedications.map(medication => {
          const availableQuantity = getAvailableQuantity(medication.id);
          const daysUntilExpiry = differenceInDays(
            new Date(medication.expiryDate),
            new Date()
          );
          const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
          const isExpired = daysUntilExpiry < 0;
          
          return (
            <div 
              key={medication.id}
              className="card cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-l-4 border-primary-500"
              onClick={() => handleSelectMedication(medication)}
            >
              <div className="space-y-3">
                {/* Header com nome e fabricante */}
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{medication.name}</h3>
                  <p className="text-gray-600 text-sm font-medium">{medication.manufacturer}</p>
                </div>

                {/* Badges de categoria e status */}
                <div className="flex flex-wrap gap-2">
                  <span className="badge bg-primary-100 text-primary-800 text-xs">
                    {medication.category}
                  </span>
                  {medication.storageType === 'refrigerated' && (
                    <span className="badge bg-blue-100 text-blue-800 text-xs flex items-center gap-1">
                      <Thermometer size={12} />
                      Refrigerado
                    </span>
                  )}
                  {medication.storageType === 'controlled' && (
                    <span className="badge bg-warning-100 text-warning-800 text-xs flex items-center gap-1">
                      <Pill size={12} />
                      Controlado
                    </span>
                  )}
                  {isExpired && (
                    <span className="badge bg-danger-100 text-danger-800 text-xs">
                      Vencido
                    </span>
                  )}
                  {isExpiringSoon && !isExpired && (
                    <span className="badge bg-warning-100 text-warning-800 text-xs">
                      Vence em {daysUntilExpiry} dias
                    </span>
                  )}
                </div>

                {/* Informações de estoque */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Estoque Disponível</span>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                      availableQuantity > medication.minimumStock 
                        ? 'bg-success-100 text-success-700' 
                        : availableQuantity > 0 
                        ? 'bg-warning-100 text-warning-700'
                        : 'bg-danger-100 text-danger-700'
                    }`}>
                      {availableQuantity} unidades
                    </div>
                  </div>
                  {availableQuantity <= medication.minimumStock && availableQuantity > 0 && (
                    <div className="flex items-center gap-1 text-warning-600 text-xs">
                      <AlertTriangle size={12} />
                      <span>Estoque baixo (mín: {medication.minimumStock})</span>
                    </div>
                  )}
                </div>

                {/* Informações do lote e validade */}
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-gray-400" />
                    <span><strong>Lote:</strong> {medication.batch}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <span className={isExpired ? 'text-danger-600 font-medium' : isExpiringSoon ? 'text-warning-600 font-medium' : ''}>
                      <strong>Validade:</strong> {new Date(medication.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Botão de ação */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-2 text-primary-600 font-medium text-sm">
                    <Users size={16} />
                    <span>Clique para Dispensar</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredMedications.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="bg-gray-50 rounded-lg p-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum medicamento disponível</h3>
              <p className="text-gray-500">
                Não há medicamentos em estoque nesta UBS para dispensação no momento.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Patient Distribution Modal */}
      {showModal && selectedMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md mx-auto p-6 w-full">
            <div className="mb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Pill className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Dispensar Medicamento</h3>
                  <p className="text-gray-600 mt-1">
                    <strong>{selectedMedication.name}</strong> - {selectedMedication.manufacturer}
                  </p>
                  <p className="text-sm text-gray-500">
                    Lote: {selectedMedication.batch} | Categoria: {selectedMedication.category}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número do SUS ou CPF do Paciente
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    name="id"
                    value={patientInfo.id}
                    onChange={handlePatientInfoChange}
                    className="input pl-10"
                    placeholder="Digite o número do SUS ou CPF"
                    required
                  />
                  <Badge className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Paciente
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    name="name"
                    value={patientInfo.name}
                    onChange={handlePatientInfoChange}
                    className="input pl-10"
                    placeholder="Nome completo do paciente"
                    required
                  />
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade a Dispensar
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    name="quantity"
                    value={patientInfo.quantity}
                    onChange={handlePatientInfoChange}
                    className="input flex-1"
                    min="1"
                    max={getAvailableQuantity(selectedMedication.id)}
                    placeholder="Qtd"
                    required
                  />
                  <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md border">
                    <span className="text-sm text-gray-600">
                      de {getAvailableQuantity(selectedMedication.id)} disponíveis
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  name="notes"
                  value={patientInfo.notes}
                  onChange={handlePatientInfoChange}
                  className="input mt-1"
                  rows={3}
                  placeholder="Observações sobre a dispensação..."
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDistributeToPatient}
                  className="btn-primary flex items-center gap-2"
                  disabled={
                    !patientInfo.id || 
                    !patientInfo.name || 
                    patientInfo.quantity <= 0 ||
                    patientInfo.quantity > getAvailableQuantity(selectedMedication.id)
                  }
                >
                  <Users size={18} />
                  Dispensar Medicamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDistribution;