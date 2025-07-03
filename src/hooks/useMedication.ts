import { useContext } from 'react';
import { MedicationContext } from '../contexts/MedicationContext';

export const useMedication = () => {
  return useContext(MedicationContext);
};