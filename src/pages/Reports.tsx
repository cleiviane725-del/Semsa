import { useState, useEffect } from 'react';
import { FileBadge as FileBar, Download, BarChart, ArrowDown, ArrowUp, AlertTriangle, Package, Calendar } from 'lucide-react';
import { useMedication } from '../hooks/useMedication';
import { useAuth } from '../hooks/useAuth';
import { differenceInDays } from 'date-fns';

const Reports = () => {
  const { medications, locations, stock, transactions, damagedItems } = useMedication();
  const { user } = useAuth();
  const [reportType, setReportType] = useState('stock');
  const [period, setPeriod] = useState('30');
  const [locationFilter, setLocationFilter] = useState('all');

  // Different report data states
  const [stockData, setStockData] = useState<any[]>([]);
  const [movementData, setMovementData] = useState<any[]>([]);
  const [expiryData, setExpiryData] = useState<any[]>([]);
  const [damagedData, setDamagedData] = useState<any[]>([]);

  const [reportDate] = useState<string>(new Date().toLocaleDateString());

  useEffect(() => {
    // Generate stock report data
    const generateStockReport = () => {
      const report = medications.map(medication => {
        // Get stock for each location
        const locationStocks = locations.map(location => {
          const stockItem = stock.find(
            item => item.medicationId === medication.id && item.locationId === location.id
          );
          return {
            locationId: location.id,
            locationName: location.name,
            quantity: stockItem ? stockItem.quantity : 0,
          };
        });
        
        // Calculate total stock
        const totalStock = locationStocks.reduce((sum, loc) => sum + loc.quantity, 0);
        
        // Check if any location has low stock
        const hasLowStock = totalStock <= medication.minimumStock;
        
        return {
          id: medication.id,
          name: medication.name,
          manufacturer: medication.manufacturer,
          batch: medication.batch,
          expiryDate: medication.expiryDate,
          category: medication.category,
          minimumStock: medication.minimumStock,
          totalStock,
          hasLowStock,
          locationStocks,
        };
      });
      
      // Filter by location if needed
      if (locationFilter !== 'all') {
        return report.filter(item => 
          item.locationStocks.some(
            loc => loc.locationId === locationFilter && loc.quantity > 0
          )
        );
      }
      
      return report;
    };
    
    // Generate movements report data
    const generateMovementReport = () => {
      // Get date limit based on period
      const periodDays = parseInt(period);
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - periodDays);
      
      // Filter transactions based on period
      let filteredTransactions = transactions.filter(
        t => new Date(t.requestDate) >= dateLimit
      );
      
      // Filter by location if needed
      if (locationFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(
          t => t.sourceLocationId === locationFilter || t.destinationLocationId === locationFilter
        );
      }
      
      // Group by medication and calculate totals
      const medicationMovements = medications.map(medication => {
        const medicationTransactions = filteredTransactions.filter(
          t => t.medicationId === medication.id
        );
        
        const receipts = medicationTransactions
          .filter(t => t.type === 'receipt' && t.status === 'completed')
          .reduce((sum, t) => sum + t.quantity, 0);
        
        const distributions = medicationTransactions
          .filter(t => t.type === 'distribution' && t.status === 'completed')
          .reduce((sum, t) => sum + t.quantity, 0);
        
        const patientDistributions = medicationTransactions
          .filter(t => t.type === 'patient' && t.status === 'completed')
          .reduce((sum, t) => sum + t.quantity, 0);
        
        const damaged = medicationTransactions
          .filter(t => t.type === 'damaged' && t.status === 'completed')
          .reduce((sum, t) => sum + t.quantity, 0);
        
        const totalIn = receipts;
        const totalOut = distributions + patientDistributions + damaged;
        const balance = totalIn - totalOut;
        
        return {
          id: medication.id,
          name: medication.name,
          receipts,
          distributions,
          patientDistributions,
          damaged,
          totalIn,
          totalOut,
          balance,
          hasMovements: totalIn > 0 || totalOut > 0,
        };
      });
      
      // Only return medications with movements
      return medicationMovements.filter(m => m.hasMovements);
    };
    
    // Generate expiry report data
    const generateExpiryReport = () => {
      const today = new Date();
      
      const report = medications.map(medication => {
        const daysUntilExpiry = differenceInDays(
          new Date(medication.expiryDate),
          today
        );
        
        // Get stock for each location
        const locationStocks = locations.map(location => {
          const stockItem = stock.find(
            item => item.medicationId === medication.id && item.locationId === location.id
          );
          return {
            locationId: location.id,
            locationName: location.name,
            quantity: stockItem ? stockItem.quantity : 0,
          };
        });
        
        // Calculate total stock
        const totalStock = locationStocks.reduce((sum, loc) => sum + loc.quantity, 0);
        
        // Status based on expiry date
        let status = 'normal';
        if (daysUntilExpiry < 0) {
          status = 'expired';
        } else if (daysUntilExpiry <= 30) {
          status = 'warning';
        } else if (daysUntilExpiry <= 90) {
          status = 'attention';
        }
        
        return {
          id: medication.id,
          name: medication.name,
          manufacturer: medication.manufacturer,
          batch: medication.batch,
          expiryDate: medication.expiryDate,
          daysUntilExpiry,
          status,
          totalStock,
          locationStocks,
        };
      });
      
      // Filter by location if needed
      if (locationFilter !== 'all') {
        return report.filter(item => 
          item.locationStocks.some(
            loc => loc.locationId === locationFilter && loc.quantity > 0
          )
        );
      }
      
      // Sort by expiry date (ascending)
      return report.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    };
    
    // Generate damaged items report data
    const generateDamagedReport = () => {
      // Get date limit based on period
      const periodDays = parseInt(period);
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - periodDays);
      
      // Filter damaged items based on period
      let filteredItems = damagedItems.filter(
        item => new Date(item.reportDate) >= dateLimit
      );
      
      // Filter by location if needed
      if (locationFilter !== 'all') {
        filteredItems = filteredItems.filter(
          item => item.locationId === locationFilter
        );
      }
      
      // Add medication info
      return filteredItems.map(item => {
        const medication = medications.find(med => med.id === item.medicationId);
        const location = locations.find(loc => loc.id === item.locationId);
        
        return {
          ...item,
          medicationName: medication ? medication.name : 'Desconhecido',
          medicationManufacturer: medication ? medication.manufacturer : 'Desconhecido',
          locationName: location ? location.name : 'Desconhecido',
        };
      });
    };
    
    // Generate reports based on selected type
    switch (reportType) {
      case 'stock':
        setStockData(generateStockReport());
        break;
      case 'movement':
        setMovementData(generateMovementReport());
        break;
      case 'expiry':
        setExpiryData(generateExpiryReport());
        break;
      case 'damaged':
        setDamagedData(generateDamagedReport());
        break;
    }
  }, [medications, locations, stock, transactions, damagedItems, reportType, period, locationFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <button className="btn-primary flex items-center gap-2">
          <Download size={18} />
          <span>Exportar PDF</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setReportType('stock')}
            className={`p-4 rounded-lg border flex flex-col items-center transition-colors ${
              reportType === 'stock'
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Package size={24} />
            <span className="mt-2">Estoque</span>
          </button>
          <button
            onClick={() => setReportType('movement')}
            className={`p-4 rounded-lg border flex flex-col items-center transition-colors ${
              reportType === 'movement'
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart size={24} />
            <span className="mt-2">Movimentações</span>
          </button>
          <button
            onClick={() => setReportType('expiry')}
            className={`p-4 rounded-lg border flex flex-col items-center transition-colors ${
              reportType === 'expiry'
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Calendar size={24} />
            <span className="mt-2">Validades</span>
          </button>
          <button
            onClick={() => setReportType('damaged')}
            className={`p-4 rounded-lg border flex flex-col items-center transition-colors ${
              reportType === 'damaged'
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle size={24} />
            <span className="mt-2">Avarias</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pb-2">
        <div className="flex-1">
          <select
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="select"
          >
            <option value="all">Todos os Locais</option>
            {locations.map(location => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>
        {(reportType === 'movement' || reportType === 'damaged') && (
          <div className="flex-1">
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="select"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="365">Último ano</option>
            </select>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileBar size={20} className="text-primary-600" />
            <span>
              {reportType === 'stock'
                ? 'Relatório de Estoque'
                : reportType === 'movement'
                ? 'Relatório de Movimentações'
                : reportType === 'expiry'
                ? 'Relatório de Validades'
                : 'Relatório de Avarias'}
            </span>
          </h2>
          <span className="text-sm text-gray-500">Gerado em: {reportDate}</span>
        </div>

        {/* Stock Report */}
        {reportType === 'stock' && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col">Medicamento</th>
                  <th scope="col">Fabricante</th>
                  <th scope="col">Categoria</th>
                  <th scope="col">Lote</th>
                  <th scope="col">Estoque Total</th>
                  <th scope="col">Estoque Mínimo</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {stockData.map(item => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.name}</td>
                    <td>{item.manufacturer}</td>
                    <td>{item.category}</td>
                    <td>{item.batch}</td>
                    <td className={item.hasLowStock ? 'text-danger-600 font-medium' : ''}>
                      {item.totalStock}
                    </td>
                    <td>{item.minimumStock}</td>
                    <td>
                      {item.hasLowStock ? (
                        <span className="badge bg-danger-100 text-danger-800">Estoque Baixo</span>
                      ) : (
                        <span className="badge bg-success-100 text-success-800">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
                {stockData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-gray-500">
                      Nenhum dado disponível para o relatório
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Movement Report */}
        {reportType === 'movement' && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col">Medicamento</th>
                  <th scope="col">Entradas</th>
                  <th scope="col">Distribuições</th>
                  <th scope="col">Dispensações</th>
                  <th scope="col">Avarias</th>
                  <th scope="col">Total Entrada</th>
                  <th scope="col">Total Saída</th>
                  <th scope="col">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {movementData.map(item => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.name}</td>
                    <td className="text-success-600">{item.receipts}</td>
                    <td>{item.distributions}</td>
                    <td>{item.patientDistributions}</td>
                    <td className="text-danger-600">{item.damaged}</td>
                    <td className="text-success-600 font-medium">
                      <div className="flex items-center gap-1">
                        <ArrowDown size={16} />
                        <span>{item.totalIn}</span>
                      </div>
                    </td>
                    <td className="text-danger-600 font-medium">
                      <div className="flex items-center gap-1">
                        <ArrowUp size={16} />
                        <span>{item.totalOut}</span>
                      </div>
                    </td>
                    <td className={`font-medium ${
                      item.balance > 0 
                        ? 'text-success-600' 
                        : item.balance < 0 
                        ? 'text-danger-600' 
                        : ''
                    }`}>
                      {item.balance}
                    </td>
                  </tr>
                ))}
                {movementData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-gray-500">
                      Nenhum dado disponível para o relatório
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Expiry Report */}
        {reportType === 'expiry' && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col">Medicamento</th>
                  <th scope="col">Fabricante</th>
                  <th scope="col">Lote</th>
                  <th scope="col">Data de Validade</th>
                  <th scope="col">Dias Restantes</th>
                  <th scope="col">Estoque</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {expiryData.map(item => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.name}</td>
                    <td>{item.manufacturer}</td>
                    <td>{item.batch}</td>
                    <td>{new Date(item.expiryDate).toLocaleDateString()}</td>
                    <td className={`font-medium ${
                      item.status === 'expired' 
                        ? 'text-danger-600' 
                        : item.status === 'warning' 
                        ? 'text-warning-600' 
                        : item.status === 'attention' 
                        ? 'text-primary-600' 
                        : ''
                    }`}>
                      {item.daysUntilExpiry < 0 
                        ? 'Vencido' 
                        : `${item.daysUntilExpiry} dias`}
                    </td>
                    <td>{item.totalStock}</td>
                    <td>
                      {item.status === 'expired' ? (
                        <span className="badge bg-danger-100 text-danger-800">Vencido</span>
                      ) : item.status === 'warning' ? (
                        <span className="badge bg-warning-100 text-warning-800">Atenção</span>
                      ) : item.status === 'attention' ? (
                        <span className="badge bg-primary-100 text-primary-800">Monitorar</span>
                      ) : (
                        <span className="badge bg-success-100 text-success-800">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
                {expiryData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-gray-500">
                      Nenhum dado disponível para o relatório
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Damaged Report */}
        {reportType === 'damaged' && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col">Medicamento</th>
                  <th scope="col">Fabricante</th>
                  <th scope="col">Local</th>
                  <th scope="col">Lote</th>
                  <th scope="col">Quantidade</th>
                  <th scope="col">Motivo</th>
                  <th scope="col">Data</th>
                </tr>
              </thead>
              <tbody>
                {damagedData.map(item => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.medicationName}</td>
                    <td>{item.medicationManufacturer}</td>
                    <td>{item.locationName}</td>
                    <td>{item.batch}</td>
                    <td className="text-danger-600 font-medium">{item.quantity}</td>
                    <td>{item.reason}</td>
                    <td>{new Date(item.reportDate).toLocaleDateString()}</td>
                  </tr>
                ))}
                {damagedData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-gray-500">
                      Nenhum dado disponível para o relatório
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;