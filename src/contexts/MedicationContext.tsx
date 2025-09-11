import { createContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';
import { useAuth } from '../hooks/useAuth';

export interface Medication {
  id: string;
  name: string;
  manufacturer: string;
  batch: string;
  expiryDate: string;
  quantity: number;
  minimumStock: number;
  storageType: 'room' | 'refrigerated' | 'controlled';
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface Utensil {
  id: string;
  name: string;
  manufacturer: string;
  batch: string;
  expiryDate?: string;
  quantity: number;
  minimumStock: number;
  storageType: 'room' | 'refrigerated' | 'controlled';
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockLocation {
  id: string;
  name: string;
  type: 'warehouse' | 'ubs';
}

export interface StockItem {
  id: string;
  itemId: string;
  itemType: 'medication' | 'utensil';
  locationId: string;
  quantity: number;
  updatedAt: string;
}

export interface StockTransaction {
  id: string;
  type: 'receipt' | 'distribution' | 'patient' | 'damaged';
  sourceLocationId: string | null;
  destinationLocationId: string | null;
  medicationId: string;
  itemId?: string;
  itemType?: 'medication' | 'utensil';
  quantity: number;
  reason: string;
  patientId?: string;
  patientName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedBy: string;
  processedBy?: string;
  requestDate: string;
  processDate?: string;
}

export interface DamagedItem {
  id: string;
  itemId: string;
  itemType: 'medication' | 'utensil';
  locationId: string;
  quantity: number;
  batch: string;
  reason: string;
  reportedBy: string;
  reportDate: string;
}

interface MedicationContextType {
  medications: Medication[];
  utensils: Utensil[];
  locations: StockLocation[];
  stock: StockItem[];
  transactions: StockTransaction[];
  damagedItems: DamagedItem[];
  
  addMedication: (medication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateMedication: (medication: Medication) => void;
  getMedicationById: (id: string) => Medication | undefined;
  
  addUtensil: (utensil: Omit<Utensil, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateUtensil: (utensil: Utensil) => void;
  getUtensilById: (id: string) => Utensil | undefined;
  
  addStockTransaction: (transaction: Omit<StockTransaction, 'id' | 'requestDate' | 'status' | 'requestedBy'>) => string;
  updateTransactionStatus: (id: string, status: 'approved' | 'rejected' | 'completed', processedBy: string) => void;
  getTransactionsByLocation: (locationId: string | null) => StockTransaction[];
  
  getLocationStock: (locationId: string) => Array<{item: Medication | Utensil, itemType: 'medication' | 'utensil', quantity: number}>;
  getTotalStock: (itemId: string, itemType: 'medication' | 'utensil') => number;
  getLocationById: (id: string) => StockLocation | undefined;
  
  reportDamagedItem: (damagedItem: Omit<DamagedItem, 'id' | 'reportDate'>) => string;
  generatePDF: (transactionIds: string[]) => void;
}

export const MedicationContext = createContext<MedicationContextType>({
  medications: [],
  utensils: [],
  locations: [],
  stock: [],
  transactions: [],
  damagedItems: [],
  
  addMedication: () => '',
  updateMedication: () => {},
  getMedicationById: () => undefined,
  
  addUtensil: () => '',
  updateUtensil: () => {},
  getUtensilById: () => undefined,
  
  addStockTransaction: () => '',
  updateTransactionStatus: () => {},
  getTransactionsByLocation: () => [],
  
  getLocationStock: () => [],
  getTotalStock: () => 0,
  getLocationById: () => undefined,
  
  reportDamagedItem: () => '',
  generatePDF: () => {},
});

interface MedicationProviderProps {
  children: ReactNode;
}

export const MedicationProvider = ({ children }: MedicationProviderProps) => {
  const { user } = useAuth();
  
  const [medications, setMedications] = useState<Medication[]>([]);
  const [utensils, setUtensils] = useState<Utensil[]>([]);
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [damagedItems, setDamagedItems] = useState<DamagedItem[]>([]);

  // Load data from localStorage on first render
  useEffect(() => {
    const loadData = () => {
      const storedMedications = localStorage.getItem('med_medications');
      if (storedMedications) {
        setMedications(JSON.parse(storedMedications));
      }

      const storedUtensils = localStorage.getItem('med_utensils');
      if (storedUtensils) {
        setUtensils(JSON.parse(storedUtensils));
      }

      const storedLocations = localStorage.getItem('med_locations');
      if (storedLocations) {
        setLocations(JSON.parse(storedLocations));
      }

      const storedStock = localStorage.getItem('med_stock');
      if (storedStock) {
        setStock(JSON.parse(storedStock));
      }

      const storedTransactions = localStorage.getItem('med_transactions');
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      }

      const storedDamagedItems = localStorage.getItem('med_damagedItems');
      if (storedDamagedItems) {
        setDamagedItems(JSON.parse(storedDamagedItems));
      }
    };

    loadData();
  }, []);

  // Persist data to localStorage whenever it changes
  useEffect(() => {
    if (medications.length > 0) {
      localStorage.setItem('med_medications', JSON.stringify(medications));
    }
  }, [medications]);

  useEffect(() => {
    if (utensils.length > 0) {
      localStorage.setItem('med_utensils', JSON.stringify(utensils));
    }
  }, [utensils]);

  useEffect(() => {
    if (locations.length > 0) {
      localStorage.setItem('med_locations', JSON.stringify(locations));
    }
  }, [locations]);

  useEffect(() => {
    if (stock.length > 0) {
      localStorage.setItem('med_stock', JSON.stringify(stock));
    }
  }, [stock]);

  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('med_transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  useEffect(() => {
    if (damagedItems.length > 0) {
      localStorage.setItem('med_damagedItems', JSON.stringify(damagedItems));
    }
  }, [damagedItems]);

  // Helper function to get medication by ID
  const getMedicationById = (id: string): Medication | undefined => {
    return medications.find(med => med.id === id);
  };

  // Helper function to get utensil by ID
  const getUtensilById = (id: string): Utensil | undefined => {
    return utensils.find(utensil => utensil.id === id);
  };

  // Helper function to get location by ID
  const getLocationById = (id: string): StockLocation | undefined => {
    return locations.find(loc => loc.id === id);
  };

  // Add a new medication to the system
  const addMedication = (medicationData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const now = new Date().toISOString();
    const newMedication: Medication = {
      ...medicationData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    
    setMedications(prev => [...prev, newMedication]);
    
    // Add initial stock to warehouse
    if (medicationData.quantity > 0) {
      console.log('🏥 Adding initial stock for new medication:', newMedication.name, 'quantity:', medicationData.quantity);
      const newStockItem: StockItem = {
        id: uuidv4(),
        itemId: newMedication.id,
        itemType: 'medication',
        locationId: 'warehouse1',
        quantity: medicationData.quantity,
        updatedAt: now,
      };
      setStock(prev => [...prev, newStockItem]);
    }
    
    return newMedication.id;
  };

  // Add a new utensil to the system
  const addUtensil = (utensilData: Omit<Utensil, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const now = new Date().toISOString();
    const newUtensil: Utensil = {
      ...utensilData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    
    setUtensils(prev => [...prev, newUtensil]);
    
    // Add initial stock to warehouse
    if (utensilData.quantity > 0) {
      const newStockItem: StockItem = {
        id: uuidv4(),
        itemId: newUtensil.id,
        itemType: 'utensil',
        locationId: 'warehouse1',
        quantity: utensilData.quantity,
        updatedAt: now,
      };
      setStock(prev => [...prev, newStockItem]);
    }
    
    return newUtensil.id;
  };

  // Update an existing medication
  const updateMedication = (medication: Medication): void => {
    setMedications(prev => 
      prev.map(med => 
        med.id === medication.id 
          ? { ...medication, updatedAt: new Date().toISOString() } 
          : med
      )
    );
  };

  // Update an existing utensil
  const updateUtensil = (utensil: Utensil): void => {
    setUtensils(prev => 
      prev.map(ut => 
        ut.id === utensil.id 
          ? { ...utensil, updatedAt: new Date().toISOString() } 
          : ut
      )
    );
  };

  // Get stock for a specific location
  const getLocationStock = (locationId: string): Array<{item: Medication | Utensil, itemType: 'medication' | 'utensil', quantity: number}> => {
    const locationStock = stock.filter(item => item.locationId === locationId);
    
    return locationStock.map(stockItem => {
      let item: Medication | Utensil | undefined;
      if (stockItem.itemType === 'medication') {
        item = medications.find(med => med.id === stockItem.itemId);
      } else {
        item = utensils.find(ut => ut.id === stockItem.itemId);
      }
      
      return {
        item: item!,
        itemType: stockItem.itemType,
        quantity: stockItem.quantity
      };
    }).filter(item => item.item !== undefined);
  };

  // Get total stock for an item across all locations
  const getTotalStock = (itemId: string, itemType: 'medication' | 'utensil'): number => {
    const totalStock = stock
      .filter(item => item.itemId === itemId && item.itemType === itemType)
      .reduce((total, item) => total + item.quantity, 0);
    
    console.log(`📊 Getting total stock for ${itemType} ${itemId}:`, totalStock);
    return totalStock;
  };

  // Helper function to update stock levels
  const updateStock = (itemId: string, itemType: 'medication' | 'utensil', locationId: string, quantityChange: number): void => {
    console.log('🔄 Updating stock:', { itemId, itemType, locationId, quantityChange });
    
  };

  // Add a new stock transaction (receipt, distribution, etc.)
  const addStockTransaction = (
    transactionData: Omit<StockTransaction, 'id' | 'requestDate' | 'status' | 'requestedBy'>
  ): string => {
    const now = new Date().toISOString();
    
    // Use medicationId as itemId for backward compatibility
    const itemId = transactionData.medicationId;
    const itemType = transactionData.itemType || 'medication';
    
    const newTransaction: StockTransaction = {
      type: transactionData.type,
      sourceLocationId: transactionData.sourceLocationId,
      destinationLocationId: transactionData.destinationLocationId,
      medicationId: itemId,
      itemType,
      quantity: transactionData.quantity,
      reason: transactionData.reason,
      patientId: transactionData.patientId,
      patientName: transactionData.patientName,
      id: uuidv4(),
      requestDate: now,
      status: transactionData.type === 'receipt' || transactionData.type === 'damaged' ? 'completed' : 'pending',
      requestedBy: user?.id || 'unknown',
    };
    
    setTransactions(prev => [...prev, newTransaction]);
    
    // Process transactions that should update stock immediately
    if (newTransaction.status === 'completed') {
      if (transactionData.type === 'receipt' && transactionData.destinationLocationId) {
        console.log('📦 Processing receipt transaction');
        updateStock(
          itemId,
          itemType,
          transactionData.destinationLocationId,
          transactionData.quantity
        );
      } else if (transactionData.type === 'damaged' && transactionData.sourceLocationId) {
        console.log('💥 Processing damaged transaction');
        updateStock(
          itemId,
          itemType,
          transactionData.sourceLocationId,
          -transactionData.quantity
        );
      } else if (transactionData.type === 'patient' && transactionData.sourceLocationId) {
        console.log('👤 Processing patient transaction');
        updateStock(
          itemId,
          itemType,
          transactionData.sourceLocationId,
          -transactionData.quantity
        );
      }
    }
    
    return newTransaction.id;
  };

  // Update the status of a transaction
  const updateTransactionStatus = (
    id: string, 
    status: 'approved' | 'rejected' | 'completed',
    processedBy: string
  ): void => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    const now = new Date().toISOString();
    const itemType = transaction.itemType || 'medication';
    
    setTransactions(prev => 
      prev.map(t => 
        t.id === id 
          ? { ...t, status, processedBy, processDate: now } 
          : t
      )
    );
    
    // Update stock levels based on status
    if (status === 'approved') {
      console.log('✅ Processing approved transaction:', transaction.type);
      
      if (transaction.sourceLocationId) {
        console.log('📤 Reducing stock from source location');
        updateStock(
          transaction.medicationId,
          itemType,
          transaction.sourceLocationId,
          -transaction.quantity
        );
      }
      
      if (transaction.destinationLocationId) {
        console.log('📥 Adding stock to destination location');
        updateStock(
          transaction.medicationId,
          itemType,
          transaction.destinationLocationId,
          transaction.quantity
        );
      }
    }
  };

  // Get transactions for a specific location
  const getTransactionsByLocation = (locationId: string | null): StockTransaction[] => {
    if (!locationId) return transactions;
    
    return transactions.filter(t => 
      t.sourceLocationId === locationId || t.destinationLocationId === locationId
    );
  };

  // Report damaged items
  const reportDamagedItem = (
    damagedItemData: Omit<DamagedItem, 'id' | 'reportDate'>
  ): string => {
    const now = new Date().toISOString();
    const newDamagedItem: DamagedItem = {
      ...damagedItemData,
      id: uuidv4(),
      reportDate: now,
    };
    
    setDamagedItems(prev => [...prev, newDamagedItem]);
    
    // Also create a transaction record for the damaged item
    addStockTransaction({
      type: 'damaged',
      sourceLocationId: damagedItemData.locationId,
      destinationLocationId: null,
      medicationId: damagedItemData.itemId,
      quantity: damagedItemData.quantity,
      reason: damagedItemData.reason,
    });
    
    return newDamagedItem.id;
  };

  // Generate PDF for approved transactions
  const generatePDF = (transactionIds: string[]): void => {
    const selectedTransactions = transactions.filter(t => transactionIds.includes(t.id));
    
    // Create PDF content
    let pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Requisição - MedControl</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #0891b2; margin: 0; }
          .header p { margin: 5px 0; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .signature { margin-top: 50px; }
          .signature-line { border-bottom: 1px solid #000; width: 300px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MedControl - Sistema de Controle</h1>
          <p>Requisição de Medicamentos e Utensílios</p>
          <p>Data: ${new Date().toLocaleDateString()} - Hora: ${new Date().toLocaleTimeString()}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Item</th>
              <th>Quantidade</th>
              <th>Origem</th>
              <th>Destino</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    selectedTransactions.forEach(transaction => {
      let itemName = 'Desconhecido';
      const medication = getMedicationById(transaction.medicationId);
      if (medication) {
        itemName = medication ? medication.name : 'Desconhecido';
      } else {
        const utensil = getUtensilById(transaction.medicationId);
        itemName = utensil ? utensil.name : 'Desconhecido';
      }
      
      const sourceName = transaction.sourceLocationId ? getLocationById(transaction.sourceLocationId)?.name : 'N/A';
      const destinationName = transaction.destinationLocationId ? getLocationById(transaction.destinationLocationId)?.name : 'N/A';
      
      pdfContent += `
        <tr>
          <td>Medicamento</td>
          <td>${itemName}</td>
          <td>${transaction.quantity}</td>
          <td>${sourceName}</td>
          <td>${destinationName}</td>
          <td>${transaction.status === 'completed' ? 'Liberado' : 'Aprovado'}</td>
        </tr>
      `;
    });
    
    pdfContent += `
          </tbody>
        </table>
        
        <div class="signature">
          <p><strong>Assinatura do Administrador:</strong></p>
          <div class="signature-line"></div>
          <p>Nome: _________________________________</p>
          <p>Data: _________________________________</p>
        </div>
      </body>
      </html>
    `;
    
    // Open PDF in new window
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(pdfContent);
      newWindow.document.close();
      newWindow.print();
    }
  };

  return (
    <MedicationContext.Provider
      value={{
        medications,
        utensils,
        locations,
        stock,
        transactions,
        damagedItems,
        
        addMedication,
        updateMedication,
        getMedicationById,
        
        addUtensil,
        updateUtensil,
        getUtensilById,
        
        addStockTransaction,
        updateTransactionStatus,
        getTransactionsByLocation,
        
        getLocationStock,
        getTotalStock,
        getLocationById,
        
        reportDamagedItem,
        generatePDF,
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
};