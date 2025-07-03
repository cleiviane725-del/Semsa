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

export interface StockLocation {
  id: string;
  name: string;
  type: 'warehouse' | 'ubs';
}

export interface StockItem {
  id: string;
  medicationId: string;
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
  medicationId: string;
  locationId: string;
  quantity: number;
  batch: string;
  reason: string;
  reportedBy: string;
  reportDate: string;
}

interface MedicationContextType {
  medications: Medication[];
  locations: StockLocation[];
  stock: StockItem[];
  transactions: StockTransaction[];
  damagedItems: DamagedItem[];
  
  addMedication: (medication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateMedication: (medication: Medication) => void;
  getMedicationById: (id: string) => Medication | undefined;
  
  addStockTransaction: (transaction: Omit<StockTransaction, 'id' | 'requestDate' | 'status' | 'requestedBy'>) => string;
  updateTransactionStatus: (id: string, status: 'approved' | 'rejected' | 'completed', processedBy: string) => void;
  getTransactionsByLocation: (locationId: string | null) => StockTransaction[];
  
  getLocationStock: (locationId: string) => Array<{medication: Medication, quantity: number}>;
  getTotalStock: (medicationId: string) => number;
  getLocationById: (id: string) => StockLocation | undefined;
  
  reportDamagedItem: (damagedItem: Omit<DamagedItem, 'id' | 'reportDate'>) => string;
}

export const MedicationContext = createContext<MedicationContextType>({
  medications: [],
  locations: [],
  stock: [],
  transactions: [],
  damagedItems: [],
  
  addMedication: () => '',
  updateMedication: () => {},
  getMedicationById: () => undefined,
  
  addStockTransaction: () => '',
  updateTransactionStatus: () => {},
  getTransactionsByLocation: () => [],
  
  getLocationStock: () => [],
  getTotalStock: () => 0,
  getLocationById: () => undefined,
  
  reportDamagedItem: () => '',
});

interface MedicationProviderProps {
  children: ReactNode;
}

export const MedicationProvider = ({ children }: MedicationProviderProps) => {
  const { user } = useAuth();
  
  const [medications, setMedications] = useState<Medication[]>([]);
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
    return newMedication.id;
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

  // Get stock for a specific location
  const getLocationStock = (locationId: string): Array<{medication: Medication, quantity: number}> => {
    const locationStock = stock.filter(item => item.locationId === locationId);
    
    return locationStock.map(stockItem => {
      const medication = medications.find(med => med.id === stockItem.medicationId);
      return {
        medication: medication!,
        quantity: stockItem.quantity
      };
    }).filter(item => item.medication !== undefined);
  };

  // Get total stock for a medication across all locations
  const getTotalStock = (medicationId: string): number => {
    return stock
      .filter(item => item.medicationId === medicationId)
      .reduce((total, item) => total + item.quantity, 0);
  };

  // Add a new stock transaction (receipt, distribution, etc.)
  const addStockTransaction = (
    transactionData: Omit<StockTransaction, 'id' | 'requestDate' | 'status' | 'requestedBy'>
  ): string => {
    const now = new Date().toISOString();
    const newTransaction: StockTransaction = {
      ...transactionData,
      id: uuidv4(),
      requestDate: now,
      status: 'pending',
      requestedBy: user?.id || 'unknown',
    };
    
    setTransactions(prev => [...prev, newTransaction]);
    
    // If it's a damaged item report, process it immediately
    if (transactionData.type === 'damaged' && transactionData.sourceLocationId) {
      updateStock(
        transactionData.medicationId,
        transactionData.sourceLocationId,
        -transactionData.quantity
      );
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
    
    setTransactions(prev => 
      prev.map(t => 
        t.id === id 
          ? { ...t, status, processedBy, processDate: now } 
          : t
      )
    );
    
    // If approved or completed, update stock levels
    if (status === 'approved' || status === 'completed') {
      if (transaction.sourceLocationId) {
        updateStock(
          transaction.medicationId,
          transaction.sourceLocationId,
          -transaction.quantity
        );
      }
      
      if (transaction.destinationLocationId) {
        updateStock(
          transaction.medicationId,
          transaction.destinationLocationId,
          transaction.quantity
        );
      }
    }
  };

  // Helper function to update stock levels
  const updateStock = (medicationId: string, locationId: string, quantityChange: number): void => {
    const existingStockItem = stock.find(
      item => item.medicationId === medicationId && item.locationId === locationId
    );
    
    if (existingStockItem) {
      // Update existing stock
      setStock(prev => 
        prev.map(item => 
          item.id === existingStockItem.id
            ? { 
                ...item, 
                quantity: Math.max(0, item.quantity + quantityChange),
                updatedAt: new Date().toISOString() 
              }
            : item
        )
      );
    } else if (quantityChange > 0) {
      // Create new stock entry if it's an addition
      const newStockItem: StockItem = {
        id: uuidv4(),
        medicationId,
        locationId,
        quantity: quantityChange,
        updatedAt: new Date().toISOString(),
      };
      
      setStock(prev => [...prev, newStockItem]);
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
      medicationId: damagedItemData.medicationId,
      quantity: damagedItemData.quantity,
      reason: damagedItemData.reason,
      status: 'completed',
    });
    
    return newDamagedItem.id;
  };

  return (
    <MedicationContext.Provider
      value={{
        medications,
        locations,
        stock,
        transactions,
        damagedItems,
        
        addMedication,
        updateMedication,
        getMedicationById,
        
        addStockTransaction,
        updateTransactionStatus,
        getTransactionsByLocation,
        
        getLocationStock,
        getTotalStock,
        getLocationById,
        
        reportDamagedItem,
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
};