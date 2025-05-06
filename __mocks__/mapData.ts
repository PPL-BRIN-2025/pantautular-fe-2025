import { MapLocation, MapConfig } from "../types";

export const mockLocations: MapLocation[] = [
  {
    city: "Jakarta",
    id: "1",
    location__latitude: -6.2,
    location__longitude: 106.8,
    location__province: "DKI Jakarta"
  },
  {
    city: "Surabaya",
    id: "2",
    location__latitude: -7.3,
    location__longitude: 112.7,
    location__province: "Jawa Timur"
  },
];

export const mockProvinceData = {
  humidity: [
    { id: "ID-JK", value: 75, status: 'normal' },
    { id: "ID-JI", value: 60, status: 'normal' }
  ],
  temperature: [
    { id: "ID-JK", value: 30, status: 'normal' },
    { id: "ID-JI", value: 32, status: 'normal' }
  ],
  precipitation: [
    { id: "ID-JK", value: 200, status: 'normal' },
    { id: "ID-JI", value: 150, status: 'normal' }
  ],
  severity: [
    { id: "ID-JK", value: 2, status: 'normal' },
    { id: "ID-JI", value: 1, status: 'normal' }
  ]
};

export const mockConfig: MapConfig = {
  zoomLevel: 5,
  centerPoint: { longitude: 120, latitude: -5 },
};

export const createNewLocation = (city: string, id: string, lat: number, lng: number, province: string): MapLocation => ({
  city,
  id,
  location__latitude: lat,
  location__longitude: lng,
  location__province: province
}); 