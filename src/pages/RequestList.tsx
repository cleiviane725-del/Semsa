import { useState, useEffect } from 'react';
import { ClipboardList, Search, Filter, Check, X, Info, Download, Plus } from 'lucide-react';
import { useMedication } from '../hooks/useMedication';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';

const RequestList = () => {
  const { medications, utensils, locations, transactions, getMedicationById, getUtensilById, getLocationById, updateTransactionStatus, generatePDF } = useMedication();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [showBulkRequestModal, setShowBulkRequestModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [bulkRequest, setBulkRequest] = useState<{[key: string]: {quantity: number, reason: string}}>({});
  const [previewItems, setPreviewItems] = useState<any[]>([]);

  useEffect(() => {
    // Get only distribution transactions
    let relevantTransactions = transactions.filter(t => t.type === 'distribution');

    // Filter based on user role
    if (user?.role === 'pharmacist' && user.ubsId) {
      // Pharmacist: only show transactions related to their UBS
      relevantTransactions = relevantTransactions.filter(
        t => t.sourceLocationId === user.ubsId || t.destinationLocationId === user.ubsId
      );
    } else if (user?.role === 'warehouse') {
      // Warehouse: show approved transactions from warehouse (ready for delivery)
      relevantTransactions = relevantTransactions.filter(
        t => t.sourceLocationId === 'warehouse1' && t.status === 'approved'
      );
    }

    // Apply search filter
    if (searchTerm) {
      relevantTransactions = relevantTransactions.filter(t => {
        const medication = getMedicationById(t.medicationId);
        const itemName = medication ? medication.name : '';
        
        const sourceName = t.sourceLocationId ? getLocationById(t.sourceLocationId)?.name : '';
        const destinationName = t.destinationLocationId ? getLocationById(t.destinationLocationId)?.name : '';
        
        return (
          itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sourceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          destinationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
  }, [transactions, searchTerm, statusFilter, user, getMedicationById, getUtensilById, getLocationById]);

  const handleTransactionSelect = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const handleApprove = () => {
    if (selectedTransaction && user?.id) {
      updateTransactionStatus(selectedTransaction.id, 'approved', user.id);
      
      addNotification({
        type: 'success',
        title: 'Solicitação Aprovada',
        message: `A solicitação foi aprovada e enviada para o almoxarifado para liberação.`,
      });
      
      setShowModal(false);
    }
  };

  const handleReject = () => {
    if (selectedTransaction && user?.id) {
      updateTransactionStatus(selectedTransaction.id, 'rejected', user.id);
      
      addNotification({
        type: 'warning',
        title: 'Solicitação Rejeitada',
        message: `A solicitação foi rejeitada.`,
      });
      
      setShowModal(false);
    }
  };

  const handleComplete = () => {
    if (selectedTransaction && user?.id) {
      updateTransactionStatus(selectedTransaction.id, 'completed', user.id);
      
      addNotification({
        type: 'success',
        title: 'Solicitação Concluída',
        message: `A solicitação foi liberada com sucesso. O estoque foi atualizado automaticamente.`,
      });
      
      setShowModal(false);
    }
  };

  const handleDeliver = () => {
    if (!selectedTransaction || !user?.id) return;

    // Get medication details
    const medication = getMedicationById(selectedTransaction.medicationId);
    const sourceLocation = selectedTransaction.sourceLocationId 
      ? getLocationById(selectedTransaction.sourceLocationId) 
      : null;
    const destinationLocation = selectedTransaction.destinationLocationId
      ? getLocationById(selectedTransaction.destinationLocationId)
      : null;

    // Generate delivery PDF
    generateDeliveryPDF({
      transaction: selectedTransaction,
      medication,
      sourceLocation,
      destinationLocation,
      warehouseUser: user,
    });

    // Mark as completed
    updateTransactionStatus(selectedTransaction.id, 'completed', user.id);
    
    addNotification({
      type: 'success',
      title: 'Entrega Realizada',
      message: `A entrega foi registrada e o PDF foi gerado com sucesso.`,
    });
    
    setShowModal(false);
  };

  const generateDeliveryPDF = ({ transaction, medication, sourceLocation, destinationLocation, warehouseUser }) => {
    const now = new Date();
    const deliveryDate = now.toLocaleDateString('pt-BR');
    const deliveryTime = now.toLocaleTimeString('pt-BR');
    
    // Create PDF content
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprovante de Entrega - SemsaControl</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.6;
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 2px solid #0891b2;
            padding-bottom: 20px;
          }
          .header h1 { 
            color: #0891b2; 
            margin: 0; 
            font-size: 28px;
          }
          .header p { 
            margin: 5px 0; 
            color: #666; 
            font-size: 16px;
          }
          .info-section {
            margin: 30px 0;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #0891b2;
          }
          .info-section h3 {
            color: #0891b2;
            margin-top: 0;
            font-size: 18px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
          }
          .info-item {
            margin: 10px 0;
          }
          .info-item strong {
            color: #0891b2;
            display: inline-block;
            width: 150px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
            background: white;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: left; 
          }
          th { 
            background-color: #0891b2; 
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          .signatures {
            margin-top: 60px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
          .signature-box {
            text-align: center;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: #f8f9fa;
          }
          .signature-line { 
            border-bottom: 2px solid #333; 
            width: 100%; 
            margin: 30px 0 10px 0; 
            height: 40px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          .delivery-info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #2196f3;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SemsaControl</h1>
          <p>Sistema de Controle de Medicamentos</p>
          <p><strong>COMPROVANTE DE ENTREGA</strong></p>
        </div>
        
        <div class="delivery-info">
          <h3>📦 Informações da Entrega</h3>
          <div class="info-grid">
            <div>
              <div class="info-item"><strong>Data:</strong> ${deliveryDate}</div>
              <div class="info-item"><strong>Horário:</strong> ${deliveryTime}</div>
            </div>
            <div>
              <div class="info-item"><strong>Protocolo:</strong> #${transaction.id.substring(0, 8).toUpperCase()}</div>
              <div class="info-item"><strong>Status:</strong> Entregue</div>
            </div>
          </div>
        </div>

        <div class="info-section">
          <h3>🏥 Informações da UBS Solicitante</h3>
          <div class="info-item"><strong>UBS:</strong> ${destinationLocation?.name || 'N/A'}</div>
          <div class="info-item"><strong>Farmacêutico:</strong> Maria Souza</div>
          <div class="info-item"><strong>Data da Solicitação:</strong> ${new Date(transaction.requestDate).toLocaleDateString('pt-BR')}</div>
        </div>

        <div class="info-section">
          <h3>👨‍💼 Informações do Administrador</h3>
          <div class="info-item"><strong>Administrador:</strong> João Silva</div>
          <div class="info-item"><strong>Data da Aprovação:</strong> ${transaction.processDate ? new Date(transaction.processDate).toLocaleDateString('pt-BR') : 'N/A'}</div>
          <div class="info-item"><strong>Status:</strong> Aprovado</div>
        </div>

        <div class="info-section">
          <h3>📦 Informações do Almoxarifado</h3>
          <div class="info-item"><strong>Responsável:</strong> ${warehouseUser.name}</div>
          <div class="info-item"><strong>Local:</strong> ${sourceLocation?.name || 'Almoxarifado Central'}</div>
          <div class="info-item"><strong>Data da Entrega:</strong> ${deliveryDate} às ${deliveryTime}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Medicamento</th>
              <th>Fabricante</th>
              <th>Lote</th>
              <th>Quantidade Entregue</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${medication?.name || 'Desconhecido'}</td>
              <td>${medication?.manufacturer || 'N/A'}</td>
              <td>${medication?.batch || 'N/A'}</td>
              <td><strong>${transaction.quantity} unidades</strong></td>
              <td>${transaction.reason}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="signatures">
          <div class="signature-box">
            <h4>Assinatura do Administrador</h4>
            <div class="signature-line"></div>
            <p><strong>João Silva</strong></p>
            <p>Administrador</p>
            <p>Data: ___/___/______</p>
          </div>
          
          <div class="signature-box">
            <h4>Assinatura do Farmacêutico</h4>
            <div class="signature-line"></div>
            <p><strong>Maria Souza</strong></p>
            <p>Farmacêutico Responsável</p>
            <p>UBS: ${destinationLocation?.name || 'N/A'}</p>
          </div>
        </div>
        
        <div class="footer">
          <p>Este documento comprova a entrega dos medicamentos listados acima.</p>
          <p>SemsaControl v1.0 - Sistema de Controle de Medicamentos</p>
          <p>Gerado em: ${deliveryDate} às ${deliveryTime}</p>
        </div>
      </body>
      </html>
    `;
    
    // Open PDF in new window for download
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(pdfContent);
      newWindow.document.close();
      
      // Trigger print dialog which allows saving as PDF
      setTimeout(() => {
        newWindow.print();
      }, 500);
    }
  };

  const handleGeneratePDF = () => {
    if (selectedTransactions.length === 0) {
      addNotification({
        type: 'warning',
        title: 'Nenhuma Solicitação Selecionada',
        message: 'Selecione pelo menos uma solicitação para gerar o PDF.',
      });
      return;
    }
    
    generatePDF(selectedTransactions);
    setSelectedTransactions([]);
  };

  const handleBulkRequestChange = (itemId: string, itemType: 'medication' | 'utensil', field: 'quantity' | 'reason', value: string | number) => {
    setBulkRequest(prev => ({
      ...prev,
      [`${itemType}_${itemId}`]: {
        ...prev[`${itemType}_${itemId}`],
        [field]: field === 'quantity' ? parseInt(value as string) || 0 : value,
        quantity: field === 'quantity' ? parseInt(value as string) || 0 : prev[`${itemType}_${itemId}`]?.quantity || 0,
        reason: field === 'reason' ? value as string : prev[`${itemType}_${itemId}`]?.reason || ''
      }
    }));
  };

  const handleBulkRequestSubmit = () => {
    const itemsWithQuantity = [];
    
    // Check medications
    medications.forEach(med => {
      const key = `medication_${med.id}`;
      if (bulkRequest[key]?.quantity > 0) {
        itemsWithQuantity.push({
          id: med.id,
          name: med.name,
          type: 'medication',
          quantity: bulkRequest[key].quantity,
          reason: bulkRequest[key].reason || 'Solicitação em lote'
        });
      }
    });
    
    // Check utensils
    utensils.forEach(utensil => {
      const key = `utensil_${utensil.id}`;
      if (bulkRequest[key]?.quantity > 0) {
        itemsWithQuantity.push({
          id: utensil.id,
          name: utensil.name,
          type: 'utensil',
          quantity: bulkRequest[key].quantity,
          reason: bulkRequest[key].reason || 'Solicitação em lote'
        });
      }
    });
    
    if (itemsWithQuantity.length === 0) {
      addNotification({
        type: 'warning',
        title: 'Nenhum Item Selecionado',
        message: 'Adicione quantidades aos itens que deseja solicitar.',
      });
      return;
    }
    
    setPreviewItems(itemsWithQuantity);
    setShowPreviewModal(true);
  };

  const handleConfirmBulkRequest = () => {
    previewItems.forEach(item => {
      addStockTransaction({
        type: 'distribution',
        sourceLocationId: 'warehouse1', // Sempre do almoxarifado
        destinationLocationId: user?.ubsId || '',
        itemId: item.id,
        itemType: item.type,
        quantity: item.quantity,
        reason: item.reason,
      });
    });
    
    addNotification({
      type: 'success',
      title: 'Solicitações Enviadas',
      message: `${previewItems.length} solicitações foram enviadas com sucesso ao Administrador.`,
    });
    
    setShowBulkRequestModal(false);
    setShowPreviewModal(false);
    setBulkRequest({});
    setPreviewItems([]);
  };

  const handleCancelPreview = () => {
    setShowPreviewModal(false);
  };

  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleSelectAll = () => {
    const approvedOrCompleted = filteredTransactions
      .filter(t => t.status === 'approved' || t.status === 'completed')
      .map(t => t.id);
    
    setSelectedTransactions(
      selectedTransactions.length === approvedOrCompleted.length ? [] : approvedOrCompleted
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Solicitações</h1>
        {user?.role === 'pharmacist' && (
          <button 
            onClick={() => setShowBulkRequestModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Nova Solicitação</span>
          </button>
        )}
        {(user?.role === 'admin' || user?.role === 'warehouse') && (
          <button 
            onClick={handleGeneratePDF}
            className="btn-primary flex items-center gap-2"
            disabled={selectedTransactions.length === 0}
          >
            <Download size={18} />
            <span>Gerar PDF ({selectedTransactions.length})</span>
          </button>
        )}
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
                {(user?.role === 'admin' || user?.role === 'warehouse') && (
                  <th scope="col">
                    <input
                      type="checkbox"
                      checked={
                        filteredTransactions
                          .filter(t => t.status === 'approved' || t.status === 'completed')
                          .length > 0 &&
                        selectedTransactions.length === 
                        filteredTransactions
                          .filter(t => t.status === 'approved' || t.status === 'completed')
                          .length
                      }
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                )}
                <th scope="col">Tipo</th>
                <th scope="col">Medicamento</th>
                <th scope="col">Solicitante</th>
                <th scope="col">Destino</th>
                <th scope="col">Quantidade</th>
                <th scope="col">Data da Solicitação</th>
                <th scope="col">Status</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(transaction => {
                const medication = getMedicationById(transaction.medicationId);
                const itemName = medication ? medication.name : 'Desconhecido';
                
                const sourceLocation = transaction.sourceLocationId 
                  ? getLocationById(transaction.sourceLocationId) 
                  : null;
                const destinationLocation = transaction.destinationLocationId
                  ? getLocationById(transaction.destinationLocationId)
                  : null;

                return (
                  <tr key={transaction.id}>
                    {(user?.role === 'admin' || user?.role === 'warehouse') && (
                      <td>
                        {(transaction.status === 'approved' || transaction.status === 'completed') && (
                          <input
                            type="checkbox"
                            checked={selectedTransactions.includes(transaction.id)}
                            onChange={() => handleSelectTransaction(transaction.id)}
                            className="rounded"
                          />
                        )}
                      </td>
                    )}
                    <td>
                      <span className="badge bg-primary-100 text-primary-800">
                        Medicamento
                      </span>
                    </td>
                    <td className="font-medium">{itemName}</td>
                    <td>{sourceLocation?.name || 'N/A'}</td>
                    <td>{destinationLocation?.name || 'N/A'}</td>
                    <td>{transaction.quantity}</td>
                    <td>{new Date(transaction.requestDate).toLocaleDateString()}</td>
                    <td>
                      {transaction.status === 'pending' ? (
                        <span className="badge bg-warning-100 text-warning-800">Pendente</span>
                      ) : transaction.status === 'approved' ? (
                        <span className="badge bg-primary-100 text-primary-800">Aprovado</span>
                      ) : transaction.status === 'completed' ? (
                        <span className="badge bg-success-100 text-success-800">Concluído</span>
                      ) : (
                        <span className="badge bg-danger-100 text-danger-800">Rejeitado</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleTransactionSelect(transaction)}
                        className="text-primary-600 hover:text-primary-800 flex items-center gap-1"
                      >
                        <Info size={16} />
                        <span>Detalhes</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={(user?.role === 'admin' || user?.role === 'warehouse') ? 9 : 8} className="text-center py-4 text-gray-500">
                    Nenhuma solicitação encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Detail Modal */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-lg mx-auto p-6 w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Detalhes da Solicitação</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Tipo</p>
                  <p className="font-medium">Medicamento</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Item</p>
                  <p className="font-medium">
                    {getMedicationById(selectedTransaction.medicationId)?.name || 'Desconhecido'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Quantidade</p>
                  <p className="font-medium">{selectedTransaction.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipo</p>
                  <p className="font-medium">Medicamento</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Origem</p>
                  <p className="font-medium">
                    {selectedTransaction.sourceLocationId
                      ? getLocationById(selectedTransaction.sourceLocationId)?.name
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Destino</p>
                  <p className="font-medium">
                    {selectedTransaction.destinationLocationId
                      ? getLocationById(selectedTransaction.destinationLocationId)?.name
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">
                  {selectedTransaction.status === 'pending'
                    ? 'Pendente'
                    : selectedTransaction.status === 'approved'
                    ? 'Aprovado'
                    : selectedTransaction.status === 'completed'
                    ? 'Concluído'
                    : 'Rejeitado'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Motivo da Solicitação</p>
                <p className="font-medium">{selectedTransaction.reason}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Data da Solicitação</p>
                  <p className="font-medium">
                    {new Date(selectedTransaction.requestDate).toLocaleString()}
                  </p>
                </div>
                {selectedTransaction.processDate && (
                  <div>
                    <p className="text-sm text-gray-500">Data de Processamento</p>
                    <p className="font-medium">
                      {new Date(selectedTransaction.processDate).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {user?.role === 'admin' && selectedTransaction.status === 'pending' && (
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={handleReject}
                    className="btn-danger"
                  >
                    Rejeitar
                  </button>
                  <button
                    onClick={handleApprove}
                    className="btn-success"
                  >
                    Aprovar
                  </button>
                </div>
              )}

              {(user?.role === 'admin' || user?.role === 'warehouse') && selectedTransaction.status === 'approved' && (
                <div className="flex justify-end gap-3 mt-6">
                  {user?.role === 'warehouse' && (
                    <button
                      onClick={handleDeliver}
                      className="btn-success flex items-center gap-2"
                    >
                      <Download size={18} />
                      <span>Entregar</span>
                    </button>
                  )}
                  <button
                    onClick={handleComplete}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Check size={18} />
                    Marcar como Concluído
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestList;