import { useState, useEffect } from 'react';
import { Users, Search, Package, Calendar, User, Badge } from 'lucide-react';
import { useMedication } from '../hooks/useMedication';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';

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
      item => item.medicationId === medicationId && item.locationId === user.ubsId
    );
    
    return stockItem ? stockItem.quantity : 0;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dispensação para Pacientes</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar medicamentos disponíveis..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMedications.map(medication => {
          const availableQuantity = getAvailableQuantity(medication.id);
          
          return (
            <div 
              key={medication.id}
              className="card cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleSelectMedication(medication)}
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <h3 className="font-semibold text-lg">{medication.name}</h3>
                  <p className="text-gray-600 text-sm">{medication.manufacturer}</p>
                  <span className="badge bg-primary-100 text-primary-800 mt-2">
                    {medication.category}
                  </span>
                </div>
                <div className="text-right">
                  <div className="bg-success-50 text-success-700 py-1 px-2 rounded font-medium">
                    {availableQuantity} disponíveis
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Clique para dispensar
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Package size={16} />
                  <span>Lote: {medication.batch}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Calendar size={16} />
                  <span>Validade: {new Date(medication.expiryDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
        {filteredMedications.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            Nenhum medicamento disponível para dispensação
          </div>
        )}
      </div>

      {/* Patient Distribution Modal */}
      {showModal && selectedMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md mx-auto p-6 w-full">
            <div className="mb-4">
              <h3 className="text-xl font-bold">Dispensar para Paciente</h3>
              <p className="text-gray-600 mt-1">
                {selectedMedication.name} ({selectedMedication.manufacturer})
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Número do SUS ou CPF do Paciente
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    name="id"
                    value={patientInfo.id}
                    onChange={handlePatientInfoChange}
                    className="input pl-10"
                    required
                  />
                  <Badge className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nome do Paciente
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    name="name"
                    value={patientInfo.name}
                    onChange={handlePatientInfoChange}
                    className="input pl-10"
                    required
                  />
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantidade a Dispensar
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={patientInfo.quantity}
                  onChange={handlePatientInfoChange}
                  className="input mt-1"
                  min="1"
                  max={getAvailableQuantity(selectedMedication.id)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Disponível: {getAvailableQuantity(selectedMedication.id)} unidades
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Observações (opcional)
                </label>
                <textarea
                  name="notes"
                  value={patientInfo.notes}
                  onChange={handlePatientInfoChange}
                  className="input mt-1"
                  rows={3}
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
                  className="btn-primary"
                  disabled={
                    !patientInfo.id || 
                    !patientInfo.name || 
                    patientInfo.quantity <= 0 ||
                    patientInfo.quantity > getAvailableQuantity(selectedMedication.id)
                  }
                >
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