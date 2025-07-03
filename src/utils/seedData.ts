import { addDays, subDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Medication, StockLocation, StockItem, StockTransaction, DamagedItem } from '../contexts/MedicationContext';

export const seedInitialData = () => {
  // Only seed if data doesn't exist
  if (localStorage.getItem('med_locations')) {
    return;
  }

  // Demo locations
  const locations: StockLocation[] = [
    {
      id: 'warehouse1',
      name: 'Almoxarifado Central',
      type: 'warehouse',
    },
    {
      id: 'ubs1',
      name: 'UBS Centro',
      type: 'ubs',
    },
    {
      id: 'ubs2',
      name: 'UBS Zona Norte',
      type: 'ubs',
    },
    {
      id: 'ubs3',
      name: 'UBS Vila Maria',
      type: 'ubs',
    },
  ];

  // Demo medications
  const medications: Medication[] = [
    {
      id: 'med1',
      name: 'Dipirona 500mg',
      manufacturer: 'EMS',
      batch: 'LOT20240301',
      expiryDate: addDays(new Date(), 180).toISOString(),
      quantity: 5000,
      minimumStock: 500,
      storageType: 'room',
      category: 'Analgésico',
      createdAt: subDays(new Date(), 30).toISOString(),
      updatedAt: subDays(new Date(), 30).toISOString(),
    },
    {
      id: 'med2',
      name: 'Paracetamol 750mg',
      manufacturer: 'Medley',
      batch: 'LOT20240215',
      expiryDate: addDays(new Date(), 240).toISOString(),
      quantity: 3000,
      minimumStock: 300,
      storageType: 'room',
      category: 'Analgésico',
      createdAt: subDays(new Date(), 45).toISOString(),
      updatedAt: subDays(new Date(), 45).toISOString(),
    },
    {
      id: 'med3',
      name: 'Amoxicilina 500mg',
      manufacturer: 'Neo Química',
      batch: 'LOT20240110',
      expiryDate: addDays(new Date(), 25).toISOString(),
      quantity: 1000,
      minimumStock: 200,
      storageType: 'room',
      category: 'Antibiótico',
      createdAt: subDays(new Date(), 60).toISOString(),
      updatedAt: subDays(new Date(), 60).toISOString(),
    },
    {
      id: 'med4',
      name: 'Losartana 50mg',
      manufacturer: 'Cimed',
      batch: 'LOT20231201',
      expiryDate: addDays(new Date(), 150).toISOString(),
      quantity: 2000,
      minimumStock: 300,
      storageType: 'room',
      category: 'Anti-hipertensivo',
      createdAt: subDays(new Date(), 90).toISOString(),
      updatedAt: subDays(new Date(), 90).toISOString(),
    },
    {
      id: 'med5',
      name: 'Insulina Regular',
      manufacturer: 'Novo Nordisk',
      batch: 'LOT20240401',
      expiryDate: addDays(new Date(), 120).toISOString(),
      quantity: 500,
      minimumStock: 100,
      storageType: 'refrigerated',
      category: 'Hormônio',
      createdAt: subDays(new Date(), 15).toISOString(),
      updatedAt: subDays(new Date(), 15).toISOString(),
    },
    {
      id: 'med6',
      name: 'Morfina 10mg',
      manufacturer: 'Cristália',
      batch: 'LOT20240115',
      expiryDate: addDays(new Date(), 200).toISOString(),
      quantity: 100,
      minimumStock: 20,
      storageType: 'controlled',
      category: 'Analgésico Opióide',
      createdAt: subDays(new Date(), 50).toISOString(),
      updatedAt: subDays(new Date(), 50).toISOString(),
    },
  ];

  // Demo stock
  const stock: StockItem[] = [
    {
      id: uuidv4(),
      medicationId: 'med1',
      locationId: 'warehouse1',
      quantity: 3000,
      updatedAt: subDays(new Date(), 30).toISOString(),
    },
    {
      id: uuidv4(),
      medicationId: 'med1',
      locationId: 'ubs1',
      quantity: 1000,
      updatedAt: subDays(new Date(), 20).toISOString(),
    },
    {
      id: uuidv4(),
      medicationId: 'med1',
      locationId: 'ubs2',
      quantity: 800,
      updatedAt: subDays(new Date(), 15).toISOString(),
    },
    {
      id: uuidv4(),
      medicationId: 'med2',
      locationId: 'warehouse1',
      quantity: 2000,
      updatedAt: subDays(new Date(), 40).toISOString(),
    },
    {
      id: uuidv4(),
      medicationId: 'med2',
      locationId: 'ubs1',
      quantity: 500,
      updatedAt: subDays(new Date(), 18).toISOString(),
    },
    {
      id: uuidv4(),
      medicationId: 'med2',
      locationId: 'ubs3',
      quantity: 500,
      updatedAt: subDays(new Date(), 10).toISOString(),
    },
    {
      id: uuidv4(),
      medicationId: 'med3',
      locationId: 'warehouse1',
      quantity: 500,
      updatedAt: subDays(new Date(), 55).toISOString(),
    },
    {
      id: uuidv4(),
      medicationId: 'med3',
      locationId: 'ubs1',
      quantity: 200,
      updatedAt: subDays(new Date(), 25).toISOString(),
    },
    {
      id: uuidv4(),
      medicationId: 'med3',
      locationId: 'ubs2',
      quantity: 200,
      updatedAt: subDays(new Date(), 22).toISOString(),
    },
    {
      id: uuidv4(),
      medicationId: 'med3',
      locationId: 'ubs3',
      quantity: 100,
      updatedAt: subDays(new Date(), 8).toISOString(),
    },
    {
      id: uuidv4(),
      medicationId: 'med4',
      locationId: 'warehouse1',
      quantity: 1000,
      updatedAt: subDays(new Date(), 85).toISOString(),
    },
    {
      id: uuidv4(),
      medicationId: 'med4',
      locationId: 'ubs1',
      quantity: 400,
      updatedAt: subDays(new Date(), 60).toISOString(),
    },
    {
      id: uuidv4(),
      medicationId: 'med4',
      locationId: 'ubs2',
      quantity: 300,
      updatedAt: subDays(new Date(), 45).toISOString(),
    },
    {
      id: uuidv4(),
      medicationId: 'med4',
      locationId: 'ubs3',
      quantity: 300,
      updatedAt: subDays(new Date(), 30).toISOString(),
    },
    {
      id: uuidv4(),
      medicationId: 'med5',
      locationId: 'warehouse1',
      quantity: 300,
      updatedAt: subDays(new Date(), 14).toISOString(),
    },
    {
      id: uuidv4(),
      medicationId: 'med5',
      locationId: 'ubs1',
      quantity: 100,
      updatedAt: subDays(new Date(), 10).toISOString(),
    },
    {
      id: uuidv4(),
      medicationId: 'med5',
      locationId: 'ubs2',
      quantity: 50,
      updatedAt: subDays(new Date(), 7).toISOString(),
    },
    {
      id: uuidv4(),
      medicationId: 'med5',
      locationId: 'ubs3',
      quantity: 50,
      updatedAt: subDays(new Date(), 5).toISOString(),
    },
    {
      id: uuidv4(),
      medicationId: 'med6',
      locationId: 'warehouse1',
      quantity: 80,
      updatedAt: subDays(new Date(), 49).toISOString(),
    },
    {
      id: uuidv4(),
      medicationId: 'med6',
      locationId: 'ubs1',
      quantity: 20,
      updatedAt: subDays(new Date(), 30).toISOString(),
    },
  ];

  // Demo transactions
  const transactions: StockTransaction[] = [
    {
      id: uuidv4(),
      type: 'receipt',
      sourceLocationId: null,
      destinationLocationId: 'warehouse1',
      medicationId: 'med1',
      quantity: 5000,
      reason: 'Compra mensal',
      status: 'completed',
      requestedBy: 'admin1',
      processedBy: 'admin1',
      requestDate: subDays(new Date(), 30).toISOString(),
      processDate: subDays(new Date(), 30).toISOString(),
    },
    {
      id: uuidv4(),
      type: 'distribution',
      sourceLocationId: 'warehouse1',
      destinationLocationId: 'ubs1',
      medicationId: 'med1',
      quantity: 1000,
      reason: 'Distribuição mensal',
      status: 'completed',
      requestedBy: 'pharm1',
      processedBy: 'admin1',
      requestDate: subDays(new Date(), 25).toISOString(),
      processDate: subDays(new Date(), 20).toISOString(),
    },
    {
      id: uuidv4(),
      type: 'distribution',
      sourceLocationId: 'warehouse1',
      destinationLocationId: 'ubs2',
      medicationId: 'med1',
      quantity: 800,
      reason: 'Distribuição mensal',
      status: 'completed',
      requestedBy: 'admin1',
      processedBy: 'admin1',
      requestDate: subDays(new Date(), 20).toISOString(),
      processDate: subDays(new Date(), 15).toISOString(),
    },
    {
      id: uuidv4(),
      type: 'patient',
      sourceLocationId: 'ubs1',
      destinationLocationId: null,
      medicationId: 'med3',
      quantity: 30,
      reason: 'Entrega ao paciente',
      patientId: '12345678901',
      patientName: 'José da Silva',
      status: 'completed',
      requestedBy: 'pharm1',
      processedBy: 'pharm1',
      requestDate: subDays(new Date(), 5).toISOString(),
      processDate: subDays(new Date(), 5).toISOString(),
    },
    {
      id: uuidv4(),
      type: 'damaged',
      sourceLocationId: 'ubs2',
      destinationLocationId: null,
      medicationId: 'med5',
      quantity: 10,
      reason: 'Quebra de frascos',
      status: 'completed',
      requestedBy: 'admin1',
      processedBy: 'admin1',
      requestDate: subDays(new Date(), 3).toISOString(),
      processDate: subDays(new Date(), 3).toISOString(),
    },
    {
      id: uuidv4(),
      type: 'distribution',
      sourceLocationId: 'warehouse1',
      destinationLocationId: 'ubs1',
      medicationId: 'med4',
      quantity: 200,
      reason: 'Solicitação emergencial',
      status: 'pending',
      requestedBy: 'pharm1',
      requestDate: subDays(new Date(), 1).toISOString(),
    },
  ];

  // Demo damaged items
  const damagedItems: DamagedItem[] = [
    {
      id: uuidv4(),
      medicationId: 'med5',
      locationId: 'ubs2',
      quantity: 10,
      batch: 'LOT20240401',
      reason: 'Quebra de frascos durante transporte',
      reportedBy: 'admin1',
      reportDate: subDays(new Date(), 3).toISOString(),
    },
    {
      id: uuidv4(),
      medicationId: 'med1',
      locationId: 'warehouse1',
      quantity: 50,
      batch: 'LOT20240301',
      reason: 'Embalagens danificadas por umidade',
      reportedBy: 'admin1',
      reportDate: subDays(new Date(), 10).toISOString(),
    },
  ];

  // Save to localStorage
  localStorage.setItem('med_locations', JSON.stringify(locations));
  localStorage.setItem('med_medications', JSON.stringify(medications));
  localStorage.setItem('med_stock', JSON.stringify(stock));
  localStorage.setItem('med_transactions', JSON.stringify(transactions));
  localStorage.setItem('med_damagedItems', JSON.stringify(damagedItems));
};