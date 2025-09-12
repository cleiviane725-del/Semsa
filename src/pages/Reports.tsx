import { useState, useEffect } from 'react';
import { FileBadge as FileBar, Download, BarChart, ArrowDown, ArrowUp, AlertTriangle, Package, Calendar, Filter } from 'lucide-react';
import { useMedication } from '../hooks/useMedication';
import { useAuth } from '../hooks/useAuth';
import { differenceInDays, isWithinInterval, startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns';

const Reports = () => {
  const { medications, utensils, locations, stock, transactions, damagedItems } = useMedication();
  const { user } = useAuth();
  const [reportType, setReportType] = useState('stock');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

  // Different report data states
  const [stockData, setStockData] = useState<any[]>([]);
  const [movementData, setMovementData] = useState<any[]>([]);
  const [expiryData, setExpiryData] = useState<any[]>([]);
  const [damagedData, setDamagedData] = useState<any[]>([]);

  const [reportDate] = useState<string>(new Date().toLocaleDateString());

  // Get date range based on period filter
  const getDateRange = () => {
    const now = new Date();
    let start: Date, end: Date;

    switch (periodFilter) {
      case 'annual':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      case 'monthly':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'custom':
        if (startDate && endDate) {
          start = new Date(startDate);
          end = new Date(endDate);
        } else {
          start = new Date(0);
          end = now;
        }
        break;
      default:
        start = new Date(0);
        end = now;
    }

    return { start, end };
  };

  useEffect(() => {
    const { start, end } = getDateRange();

    // Generate stock report data
    const generateStockReport = () => {
      const report = medications.map(medication => {
        // Get stock for each location
        const locationStocks = locations.map(location => {
          const stockItem = stock.find(
            item => item.itemId === medication.id && item.itemType === 'medication' && item.locationId === location.id
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
      // Filter transactions based on date range
      let filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.requestDate);
        return isWithinInterval(transactionDate, { start, end });
      });
      
      // Filter by location if needed
      if (locationFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(
          t => t.sourceLocationId === locationFilter || t.destinationLocationId === locationFilter
        );
      }
      
      // Group by medication and calculate totals
      const medicationMovements = medications.map(medication => {
        const medicationTransactions = filteredTransactions.filter(
          t => (t.itemId || t.medicationId) === medication.id
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
            item => item.itemId === medication.id && item.itemType === 'medication' && item.locationId === location.id
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
      // Filter damaged items based on date range
      let filteredItems = damagedItems.filter(item => {
        const itemDate = new Date(item.reportDate);
        return isWithinInterval(itemDate, { start, end });
      });
      
      // Filter by location if needed
      if (locationFilter !== 'all') {
        filteredItems = filteredItems.filter(
          item => item.locationId === locationFilter
        );
      }
      
      // Add medication info
      return filteredItems.map(item => {
        const medication = medications.find(med => med.id === item.itemId);
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
  }, [medications, locations, stock, transactions, damagedItems, reportType, periodFilter, startDate, endDate, locationFilter]);

  // Generate PDF report
  const generatePDFReport = () => {
    const { start, end } = getDateRange();
    const periodText = periodFilter === 'annual' ? 'Anual' : 
                     periodFilter === 'monthly' ? 'Mensal' : 
                     periodFilter === 'custom' ? 'Periódico' : 'Geral';
    
    const reportTitle = reportType === 'stock' ? 'Relatório de Estoque' :
                       reportType === 'movement' ? 'Relatório de Movimentações' :
                       reportType === 'expiry' ? 'Relatório de Validades' :
                       'Relatório de Avarias';

    let tableContent = '';
    let currentData: any[] = [];

    // Get current data based on report type
    switch (reportType) {
      case 'stock':
        currentData = stockData;
        tableContent = `
          <thead>
            <tr>
              <th>Medicamento</th>
              <th>Fabricante</th>
              <th>Categoria</th>
              <th>Lote</th>
              <th>Estoque Total</th>
              <th>Estoque Mínimo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${currentData.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.manufacturer}</td>
                <td>${item.category}</td>
                <td>${item.batch}</td>
                <td class="${item.hasLowStock ? 'low-stock' : ''}">${item.totalStock}</td>
                <td>${item.minimumStock}</td>
                <td class="${item.hasLowStock ? 'status-warning' : 'status-normal'}">
                  ${item.hasLowStock ? 'Estoque Baixo' : 'Normal'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        `;
        break;

      case 'movement':
        currentData = movementData;
        tableContent = `
          <thead>
            <tr>
              <th>Medicamento</th>
              <th>Entradas</th>
              <th>Distribuições</th>
              <th>Dispensações</th>
              <th>Avarias</th>
              <th>Total Entrada</th>
              <th>Total Saída</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            ${currentData.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="positive">${item.receipts}</td>
                <td>${item.distributions}</td>
                <td>${item.patientDistributions}</td>
                <td class="negative">${item.damaged}</td>
                <td class="positive"><strong>${item.totalIn}</strong></td>
                <td class="negative"><strong>${item.totalOut}</strong></td>
                <td class="${item.balance > 0 ? 'positive' : item.balance < 0 ? 'negative' : ''}">
                  <strong>${item.balance}</strong>
                </td>
              </tr>
            `).join('')}
          </tbody>
        `;
        break;

      case 'expiry':
        currentData = expiryData;
        tableContent = `
          <thead>
            <tr>
              <th>Medicamento</th>
              <th>Fabricante</th>
              <th>Lote</th>
              <th>Data de Validade</th>
              <th>Dias Restantes</th>
              <th>Estoque</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${currentData.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.manufacturer}</td>
                <td>${item.batch}</td>
                <td>${new Date(item.expiryDate).toLocaleDateString()}</td>
                <td class="${item.status === 'expired' ? 'expired' : item.status === 'warning' ? 'warning' : ''}">
                  ${item.daysUntilExpiry < 0 ? 'Vencido' : `${item.daysUntilExpiry} dias`}
                </td>
                <td>${item.totalStock}</td>
                <td class="status-${item.status}">
                  ${item.status === 'expired' ? 'Vencido' : 
                    item.status === 'warning' ? 'Atenção' : 
                    item.status === 'attention' ? 'Monitorar' : 'Normal'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        `;
        break;

      case 'damaged':
        currentData = damagedData;
        tableContent = `
          <thead>
            <tr>
              <th>Medicamento</th>
              <th>Fabricante</th>
              <th>Local</th>
              <th>Lote</th>
              <th>Quantidade</th>
              <th>Motivo</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            ${currentData.map(item => `
              <tr>
                <td>${item.medicationName}</td>
                <td>${item.medicationManufacturer}</td>
                <td>${item.locationName}</td>
                <td>${item.batch}</td>
                <td class="negative"><strong>${item.quantity}</strong></td>
                <td>${item.reason}</td>
                <td>${new Date(item.reportDate).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        `;
        break;
    }

    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportTitle} - SemsaControl</title>
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
          .report-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #0891b2;
          }
          .report-info h3 {
            color: #0891b2;
            margin-top: 0;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin: 15px 0;
          }
          .info-item strong {
            color: #0891b2;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
            background: white;
            font-size: 12px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
          }
          th { 
            background-color: #0891b2; 
            color: white;
            font-weight: bold;
            font-size: 11px;
          }
          tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          .low-stock, .negative {
            color: #dc2626;
            font-weight: bold;
          }
          .positive {
            color: #16a34a;
            font-weight: bold;
          }
          .expired {
            color: #dc2626;
            font-weight: bold;
          }
          .warning {
            color: #d97706;
            font-weight: bold;
          }
          .status-expired {
            background-color: #fef2f2;
            color: #dc2626;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
          }
          .status-warning {
            background-color: #fffbeb;
            color: #d97706;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
          }
          .status-normal {
            background-color: #f0fdf4;
            color: #16a34a;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          .summary {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .summary h4 {
            color: #1976d2;
            margin-top: 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SemsaControl</h1>
          <p>Sistema de Controle de Medicamentos</p>
          <p><strong>${reportTitle} - ${periodText}</strong></p>
        </div>
        
        <div class="report-info">
          <h3>📊 Informações do Relatório</h3>
          <div class="info-grid">
            <div><strong>Tipo:</strong> ${reportTitle}</div>
            <div><strong>Período:</strong> ${periodText}</div>
            <div><strong>Gerado em:</strong> ${reportDate}</div>
            <div><strong>Administrador:</strong> ${user?.name || 'João Silva'}</div>
            <div><strong>Total de Registros:</strong> ${currentData.length}</div>
            <div><strong>Local:</strong> ${locationFilter === 'all' ? 'Todos os Locais' : locations.find(l => l.id === locationFilter)?.name}</div>
          </div>
          ${periodFilter === 'custom' && startDate && endDate ? `
            <div style="margin-top: 15px;">
              <strong>Período Personalizado:</strong> ${new Date(startDate).toLocaleDateString()} até ${new Date(endDate).toLocaleDateString()}
            </div>
          ` : ''}
        </div>

        ${currentData.length > 0 ? `
          <div class="summary">
            <h4>📈 Resumo Executivo</h4>
            ${reportType === 'stock' ? `
              <p><strong>Itens com Estoque Baixo:</strong> ${currentData.filter(item => item.hasLowStock).length}</p>
              <p><strong>Total de Medicamentos:</strong> ${currentData.length}</p>
            ` : reportType === 'movement' ? `
              <p><strong>Total de Entradas:</strong> ${currentData.reduce((sum, item) => sum + item.totalIn, 0)}</p>
              <p><strong>Total de Saídas:</strong> ${currentData.reduce((sum, item) => sum + item.totalOut, 0)}</p>
              <p><strong>Saldo Geral:</strong> ${currentData.reduce((sum, item) => sum + item.balance, 0)}</p>
            ` : reportType === 'expiry' ? `
              <p><strong>Medicamentos Vencidos:</strong> ${currentData.filter(item => item.status === 'expired').length}</p>
              <p><strong>Próximos ao Vencimento:</strong> ${currentData.filter(item => item.status === 'warning').length}</p>
            ` : `
              <p><strong>Total de Avarias:</strong> ${currentData.reduce((sum, item) => sum + item.quantity, 0)} unidades</p>
              <p><strong>Itens Avariados:</strong> ${currentData.length}</p>
            `}
          </div>
        ` : ''}
        
        <table>
          ${tableContent}
        </table>
        
        ${currentData.length === 0 ? `
          <div style="text-align: center; padding: 40px; color: #666;">
            <h3>📋 Nenhum Dado Encontrado</h3>
            <p>Não há dados disponíveis para o período e filtros selecionados.</p>
          </div>
        ` : ''}
        
        <div class="footer">
          <p><strong>SemsaControl v1.0</strong> - Sistema de Controle de Medicamentos</p>
          <p>Relatório gerado em: ${new Date().toLocaleString()}</p>
          <p>Este documento foi gerado automaticamente pelo sistema SemsaControl</p>
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <button 
          onClick={generatePDFReport}
          className="btn-primary flex items-center gap-2"
        >
          <Download size={18} />
          <span>Exportar PDF</span>
        </button>
      </div>

      {/* Report Type Selection */}
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

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-primary-600" />
          <h3 className="text-lg font-semibold">Filtros do Relatório</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Period Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período
            </label>
            <select
              value={periodFilter}
              onChange={e => setPeriodFilter(e.target.value)}
              className="select"
            >
              <option value="all">Todos os Períodos</option>
              <option value="annual">Relatório Anual</option>
              <option value="monthly">Relatório Mensal</option>
              <option value="custom">Relatório Periódico</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Local
            </label>
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

          {/* Start Date - Only show for custom period */}
          {periodFilter === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="input"
              />
            </div>
          )}

          {/* End Date - Only show for custom period */}
          {periodFilter === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Fim
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="input"
              />
            </div>
          )}
        </div>
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
          <div className="text-sm text-gray-500">
            <span>Gerado em: {reportDate}</span>
            {periodFilter === 'custom' && startDate && endDate && (
              <span className="ml-4">
                Período: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
              </span>
            )}
          </div>
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