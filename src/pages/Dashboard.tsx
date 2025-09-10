import { useEffect, useState } from 'react';
import { Package, Truck, AlertTriangle, Pill, Activity, TrendingDown } from 'lucide-react';
import { useMedication } from '../hooks/useMedication';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { differenceInDays } from 'date-fns';

const Dashboard = () => {
  const { medications, utensils, locations, stock, transactions } = useMedication();
  const { user } = useAuth();
  const { notifications } = useNotification();
  const [stats, setStats] = useState({
    totalMedications: 0,
    lowStockItems: 0,
    nearExpiryItems: 0,
    pendingRequests: 0,
    totalDistributions: 0,
    damagedItems: 0,
  });

  useEffect(() => {
    // Calculate dashboard statistics
    const userUbsId = user?.ubsId;
    const allItems = [...medications.map(m => ({...m, itemType: 'medication' as const})), ...utensils.map(u => ({...u, itemType: 'utensil' as const}))];
    
    let filteredStock = stock;
    if (user?.role === 'pharmacist' && userUbsId) {
      filteredStock = stock.filter(item => item.locationId === userUbsId);
    }
    
    const lowStockItems = allItems.filter(item => {
      const totalStock = filteredStock
        .filter(stockItem => stockItem.itemId === item.id && stockItem.itemType === item.itemType)
        .reduce((sum, stockItem) => sum + stockItem.quantity, 0);
      return totalStock <= item.minimumStock;
    });
    
    const nearExpiryItems = allItems.filter(item => {
      if (!item.expiryDate) return false;
      const daysUntilExpiry = differenceInDays(
        new Date(item.expiryDate),
        new Date()
      );
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    });
    
    let pendingRequests = transactions.filter(t => t.status === 'pending');
    if (user?.role === 'pharmacist' && userUbsId) {
      pendingRequests = pendingRequests.filter(
        t => t.sourceLocationId === userUbsId || t.destinationLocationId === userUbsId
      );
    }
    
    let recentDistributions = transactions.filter(
      t => t.type === 'distribution' && t.status === 'completed'
    );
    if (user?.role === 'pharmacist' && userUbsId) {
      recentDistributions = recentDistributions.filter(
        t => t.destinationLocationId === userUbsId
      );
    }
    
    const damagedItemsCount = transactions.filter(
      t => t.type === 'damaged' && t.status === 'completed'
    ).length;
    
    setStats({
      totalMedications: allItems.length,
      lowStockItems: lowStockItems.length,
      nearExpiryItems: nearExpiryItems.length,
      pendingRequests: pendingRequests.length,
      totalDistributions: recentDistributions.length,
      damagedItems: damagedItemsCount,
    });
  }, [medications, utensils, stock, transactions, user]);

  const filterTransactions = (type: string, status?: string) => {
    let filtered = [...transactions];
    
    if (user?.role === 'pharmacist' && user.ubsId) {
      filtered = filtered.filter(t => 
        t.sourceLocationId === user.ubsId || t.destinationLocationId === user.ubsId
      );
    }
    
    filtered = filtered.filter(t => t.type === type);
    
    if (status) {
      filtered = filtered.filter(t => t.status === status);
    }
    
    return filtered.slice(0, 5);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Bem-vindo(a), {user?.name} | {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Total de Medicamentos"
          value={stats.totalMedications}
          icon={<Pill className="h-12 w-12 text-primary-500" />}
          bgColor="bg-primary-50"
          textColor="text-primary-700"
        />
        <StatsCard
          title="Estoque Baixo"
          value={stats.lowStockItems}
          icon={<TrendingDown className="h-12 w-12 text-warning-500" />}
          bgColor="bg-warning-50"
          textColor="text-warning-700"
        />
        <StatsCard
          title="Próximos do Vencimento"
          value={stats.nearExpiryItems}
          icon={<AlertTriangle className="h-12 w-12 text-danger-500" />}
          bgColor="bg-danger-50"
          textColor="text-danger-700"
        />
        <StatsCard
          title="Solicitações Pendentes"
          value={stats.pendingRequests}
          icon={<Package className="h-12 w-12 text-primary-500" />}
          bgColor="bg-primary-50"
          textColor="text-primary-700"
        />
        <StatsCard
          title="Distribuições Realizadas"
          value={stats.totalDistributions}
          icon={<Truck className="h-12 w-12 text-success-500" />}
          bgColor="bg-success-50"
          textColor="text-success-700"
        />
        <StatsCard
          title="Itens Avariados"
          value={stats.damagedItems}
          icon={<Activity className="h-12 w-12 text-danger-500" />}
          bgColor="bg-danger-50"
          textColor="text-danger-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Medicamentos com Estoque Baixo</h2>
            <a href="/medications" className="text-sm text-primary-600 hover:text-primary-700">
              Ver todos
            </a>
          </div>
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col">Nome</th>
                    <th scope="col">Categoria</th>
                    <th scope="col">Estoque Atual</th>
                    <th scope="col">Estoque Mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  {medications
                    .filter(med => {
                      const totalStock = stock
                        .filter(item => item.medicationId === med.id)
                        .reduce((sum, item) => sum + item.quantity, 0);
                      return totalStock <= med.minimumStock;
                    })
                    .slice(0, 5)
                    .map(med => {
                      const totalStock = stock
                        .filter(item => item.medicationId === med.id)
                        .reduce((sum, item) => sum + item.quantity, 0);
                      
                      return (
                        <tr key={med.id}>
                          <td className="font-medium">{med.name}</td>
                          <td>{med.category}</td>
                          <td className="text-danger-600 font-medium">{totalStock}</td>
                          <td>{med.minimumStock}</td>
                        </tr>
                      );
                    })}
                  {medications.filter(med => {
                    const totalStock = stock
                      .filter(item => item.medicationId === med.id)
                      .reduce((sum, item) => sum + item.quantity, 0);
                    return totalStock <= med.minimumStock;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-gray-500">
                        Nenhum medicamento com estoque baixo
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Medicamentos a Vencer</h2>
            <a href="/medications" className="text-sm text-primary-600 hover:text-primary-700">
              Ver todos
            </a>
          </div>
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col">Nome</th>
                    <th scope="col">Lote</th>
                    <th scope="col">Validade</th>
                    <th scope="col">Dias Restantes</th>
                  </tr>
                </thead>
                <tbody>
                  {medications
                    .filter(med => {
                      const daysUntilExpiry = differenceInDays(
                        new Date(med.expiryDate),
                        new Date()
                      );
                      return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
                    })
                    .sort((a, b) => 
                      new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
                    )
                    .slice(0, 5)
                    .map(med => {
                      const daysUntilExpiry = differenceInDays(
                        new Date(med.expiryDate),
                        new Date()
                      );
                      
                      return (
                        <tr key={med.id}>
                          <td className="font-medium">{med.name}</td>
                          <td>{med.batch}</td>
                          <td>{new Date(med.expiryDate).toLocaleDateString()}</td>
                          <td>
                            <span 
                              className={`${
                                daysUntilExpiry <= 7 
                                  ? 'text-danger-600' 
                                  : daysUntilExpiry <= 15 
                                  ? 'text-warning-600' 
                                  : 'text-gray-600'
                              } font-medium`}
                            >
                              {daysUntilExpiry} dias
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  {medications.filter(med => {
                    const daysUntilExpiry = differenceInDays(
                      new Date(med.expiryDate),
                      new Date()
                    );
                    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-gray-500">
                        Nenhum medicamento próximo do vencimento
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Últimas Solicitações</h2>
            <a href="/requests" className="text-sm text-primary-600 hover:text-primary-700">
              Ver todas
            </a>
          </div>
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col">Medicamento</th>
                    <th scope="col">Quantidade</th>
                    <th scope="col">Status</th>
                    <th scope="col">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filterTransactions('distribution')
                    .map(transaction => {
                      const medication = medications.find(m => m.id === transaction.medicationId);
                      return (
                        <tr key={transaction.id}>
                          <td className="font-medium">{medication?.name || 'Desconhecido'}</td>
                          <td>{transaction.quantity}</td>
                          <td>
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
                          </td>
                          <td>{new Date(transaction.requestDate).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  {filterTransactions('distribution').length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-gray-500">
                        Nenhuma solicitação encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Últimas Notificações</h2>
            <button className="text-sm text-primary-600 hover:text-primary-700">
              Marcar todas como lidas
            </button>
          </div>
          <div className="space-y-3">
            {notifications.slice(0, 5).map(notification => (
              <div 
                key={notification.id} 
                className={`p-3 rounded-lg border ${
                  notification.read ? 'border-gray-200' : 'border-primary-200 bg-primary-50'
                }`}
              >
                <div className="flex items-start">
                  <div
                    className={`h-2 w-2 mt-1.5 mr-2 rounded-full ${
                      notification.type === 'warning'
                        ? 'bg-warning-500'
                        : notification.type === 'error'
                        ? 'bg-danger-500'
                        : notification.type === 'success'
                        ? 'bg-success-500'
                        : 'bg-primary-500'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{notification.title}</p>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma notificação encontrada
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
}

const StatsCard = ({ title, value, icon, bgColor, textColor }: StatsCardProps) => {
  return (
    <div className="card animate-slide-in hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center">
        <div className={`rounded-lg p-3 ${bgColor}`}>{icon}</div>
        <div className="ml-4">
          <p className="text-gray-600 text-sm">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${textColor}`}>{value}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;