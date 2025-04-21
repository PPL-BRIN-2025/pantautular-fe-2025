import {create} from 'zustand';
import { MapChartService } from '../services/mapChartService';

type ActiveButton = 'rain' | 'severity' | 'temperature' | 'humidity' | null;

interface MapStore {
  countSelectedPoints: number;
  setCountSelectedPoints: (count: number) => void;
  mapService: MapChartService | null;
  setMapService: (service: MapChartService | null) => void;
  activeButton: ActiveButton;
  setActiveButton: (button: ActiveButton) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  countSelectedPoints: 0,
  setCountSelectedPoints: (count: number) => set({ countSelectedPoints: count }),
  mapService: null,
  setMapService: (service: MapChartService | null) => set({ mapService: service }),
  activeButton: null,
  setActiveButton: (button: ActiveButton) => set({ activeButton: button }),
}));