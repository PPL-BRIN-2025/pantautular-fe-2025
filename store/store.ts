import {create} from 'zustand';

interface MapStore {
  countSelectedPoints: number;
  setCountSelectedPoints: (count: number) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  countSelectedPoints: 0,
  setCountSelectedPoints: (count: number) => set({ countSelectedPoints: count }),
}));