import React, { useState, useEffect } from 'react';
import { Search, Package, User, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { useMedication } from '../hooks/useMedication';
import { useAuth } from '../hooks/useAuth';

interface PatientInfo {
  susNumber: string;
  name: string;
  quantity: number;
  observations: string;
}

const PatientDistribution: React.FC = () => {
  const { user } = useAuth();
  const { 
    medications, 
    getLocationStock,
    stock,
    addStockTransaction, 
    getTotalStock 
  } = useMedication();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedication, setSelectedMedication] = useState<any>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    susNumber: '',
    name: '',
    quantity: 1,
    observations: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Get available medications in this UBS
  const availableMedications = React.useMemo(() => {
    if (!user?.ubsId) return [];
    
    console.log('🏥 All stock:', stock);
    console.log('🏥 User UBS ID:', user.ubsId);
    
    // Get stock items for this UBS
    const ubsStock = stock.filter(item => 
      item.locationId === user.ubsId && 
      item.itemType === 'medication' && 
      item.quantity > 0
    );
    
    console.log('🏥 UBS stock items:', ubsStock);
    
    return ubsStock
      .map(stockItem => {
        const medication = medications.find(med => med.id === stockItem.itemId);
        if (!medication) return null;
        
        return {
          ...medication,
          availableQuantity: stockItem.quantity
        };
      })
      .filter(med => med !== null)
      .filter(med => 
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [user?.ubsId, stock, medications, searchTerm, refreshTrigger]);

  const handleDispenseMedication = () => {
    if (!selectedMedication || !user?.ubsId) return;

    // Validate required fields
    if (!patientInfo.susNumber.trim() || !patientInfo.name.trim() || patientInfo.quantity <= 0) {
      setNotification({
        type: 'error',
        message: 'Por favor, preencha todos os campos obrigatórios.'
      });
      return;
    }

    // Check if there's enough stock
    if (patientInfo.quantity > selectedMedication.availableQuantity) {
      setNotification({
        type: 'error',
        message: `Não há estoque suficiente de ${selectedMedication.name}. Disponível: ${selectedMedication.availableQuantity}, Solicitado: ${patientInfo.quantity}`
      });
      return;
    }

    console.log('👤 Dispensing medication:', {
      medication: selectedMedication.name,
      quantity: patientInfo.quantity,
      patient: patientInfo.name,
      ubsId: user.ubsId
    });

    // Create patient dispensation transaction
    addStockTransaction({
      type: 'patient',
      sourceLocationId: user.ubsId,
      destinationLocationId: null,
      medicationId: selectedMedication.id,
      itemType: 'medication',
      quantity: patientInfo.quantity,
      reason: `Dispensação para paciente: ${patientInfo.name}`,
      patientId: patientInfo.susNumber,
      patientName: patientInfo.name
    });

    setNotification({
      type: 'success',
      message: `Medicamento ${selectedMedication.name} dispensado com sucesso para ${patientInfo.name}!`
    });

    // Reset form and close modal
    setPatientInfo({
      susNumber: '',
      name: '',
      quantity: 1,
      observations: ''
    });
    setShowModal(false);
    setSelectedMedication(null);
    
    // Force refresh of available medications
    setRefreshTrigger(prev => prev + 1);
  };

  const openDispenseModal = (medication: any) => {
    setSelectedMedication(medication);
    setShowModal(true);
  };

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dispensação para Pacientes</h1>
        <p className="text-gray-600">Selecione um medicamento disponível para dispensar ao paciente</p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg flex items-center space-x-3 ${
          notification.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por nome, fabricante ou categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
          <Package className="w-4 h-4 inline mr-1" />
          {availableMedications.length} medicamentos disponíveis
        </div>
      </div>

      {/* Medications Grid */}
      {availableMedications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableMedications.map((medication) => (
            <div key={medication.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{medication.name}</h3>
                  <p className="text-gray-600">{medication.manufacturer}</p>
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {medication.category}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Estoque Disponível</span>
                    <span className={`font-bold text-lg ${
                      medication.availableQuantity <= medication.minimumStock 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {medication.availableQuantity}
                      <span className="text-sm font-normal text-gray-500 ml-1">unidades</span>
                    </span>
                  </div>
                  
                  {medication.availableQuantity <= medication.minimumStock && (
                    <div className="flex items-center text-amber-600 text-sm">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Estoque baixo (mín: {medication.minimumStock})
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-500 space-y-1">
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    <span>Lote: {medication.batch}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Validade: {new Date(medication.expiryDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => openDispenseModal(medication)}
                  disabled={medication.availableQuantity === 0}
                  className="w-full flex items-center justify-center space-x-2 bg-cyan-600 text-white py-2 px-4 rounded-lg hover:bg-cyan-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Clique para Dispensar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum medicamento disponível</h3>
          <p className="text-gray-500">Não há medicamentos em estoque nesta UBS para dispensação no momento.</p>
        </div>
      )}

      {/* Dispense Modal */}
      {showModal && selectedMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <Package className="w-6 h-6 text-cyan-600" />
              <h2 className="text-xl font-bold text-gray-900">Dispensar Medicamento</h2>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">{selectedMedication.name} - {selectedMedication.manufacturer}</h3>
              <p className="text-sm text-gray-600">Lote: {selectedMedication.batch} | Categoria: {selectedMedication.category}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número do SUS ou CPF do Paciente
                </label>
                <input
                  type="text"
                  value={patientInfo.susNumber}
                  onChange={(e) => setPatientInfo(prev => ({ ...prev, susNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="1234567888"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Paciente
                </label>
                <input
                  type="text"
                  value={patientInfo.name}
                  onChange={(e) => setPatientInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="José Ruan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade a Dispensar
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max={selectedMedication.availableQuantity}
                    value={patientInfo.quantity}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-500">de {selectedMedication.availableQuantity} disponíveis</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  value={patientInfo.observations}
                  onChange={(e) => setPatientInfo(prev => ({ ...prev, observations: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Observações sobre a dispensação..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedMedication(null);
                  setPatientInfo({
                    susNumber: '',
                    name: '',
                    quantity: 1,
                    observations: ''
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDispenseMedication}
                className="flex-1 flex items-center justify-center space-x-2 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Dispensar Medicamento</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDistribution;