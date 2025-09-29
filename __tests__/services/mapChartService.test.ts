import { MapChartService } from "../../services/mapChartService";
import { MapChartManager } from "../../services/map";
import { MapConfig, MapLocation, ProvinceData } from "../../types";

jest.mock("../../services/map", () => ({
  MapChartManager: jest.fn(),
}));

type ManagerMock = {
  initialize: jest.Mock;
  dispose: jest.Mock;
  populateLocations: jest.Mock;
  zoomToLocation: jest.Mock;
  populateProvinceHumidityData: jest.Mock;
  populateProvincePrecipitationData: jest.Mock;
  populateProvinceTemperatureData: jest.Mock;
  populateProvinceSeverityData: jest.Mock;
  toggleLayers: jest.Mock;
  countSelectedPoints: number;
};

const MapChartManagerMock = MapChartManager as unknown as jest.Mock;

const createMockManager = (): ManagerMock => ({
  initialize: jest.fn(),
  dispose: jest.fn(),
  populateLocations: jest.fn(),
  zoomToLocation: jest.fn(),
  populateProvinceHumidityData: jest.fn(),
  populateProvincePrecipitationData: jest.fn(),
  populateProvinceTemperatureData: jest.fn(),
  populateProvinceSeverityData: jest.fn(),
  toggleLayers: jest.fn(),
  countSelectedPoints: 0,
});

let managerInstances: ManagerMock[] = [];

const getLastManager = () => managerInstances[managerInstances.length - 1];

beforeEach(() => {
  managerInstances = [];
  MapChartManagerMock.mockReset();
  MapChartManagerMock.mockImplementation(() => {
    const instance = createMockManager();
    managerInstances.push(instance);
    return instance;
  });
});

const createService = (onError?: (message: string) => void) => {
  const service = new MapChartService(onError);
  return { service, manager: getLastManager() };
};

describe("MapChartService", () => {
  const config: MapConfig = {
    zoomLevel: 5,
    centerPoint: { longitude: 120, latitude: -5 },
  };

  it("constructs MapChartManager with provided onError handler", () => {
    const onError = jest.fn();
    createService(onError);
    expect(MapChartManagerMock).toHaveBeenCalledWith(onError);
  });

  it("constructs MapChartManager with undefined onError by default", () => {
    createService();
    expect(MapChartManagerMock).toHaveBeenCalledWith(undefined);
  });

  it("initializes the map via the manager", () => {
    const { service, manager } = createService();
    service.initialize("container", config);
    expect(manager.initialize).toHaveBeenCalledWith("container", config);
  });

  it("disposes resources via the manager", () => {
    const { service, manager } = createService();
    service.dispose();
    expect(manager.dispose).toHaveBeenCalled();
  });

  it("populates locations via the manager", () => {
    const { service, manager } = createService();
    const locations: MapLocation[] = [
      {
        id: "1",
        location__latitude: -6.2,
        location__longitude: 106.8,
        location__province: "DKI Jakarta",
        city: "Jakarta",
      },
    ];
    service.populateLocations(locations);
    expect(manager.populateLocations).toHaveBeenCalledWith(locations);
  });

  it("exposes the current selected point count from the manager", () => {
    const { service, manager } = createService();
    manager.countSelectedPoints = 42;
    expect(service.countSelectedPoints).toBe(42);
  });

  it("zooms to a location via the manager", () => {
    const { service, manager } = createService();
    service.zoomToLocation(-6.2, 106.8);
    expect(manager.zoomToLocation).toHaveBeenCalledWith(-6.2, 106.8);
  });

  it("populates province humidity data via the manager", () => {
    const { service, manager } = createService();
    const data: ProvinceData[] = [{ id: "ID-JK", value: 10, status: "High" }];
    service.populateProvinceHumidityData(data);
    expect(manager.populateProvinceHumidityData).toHaveBeenCalledWith(data);
  });

  it("populates province precipitation data via the manager", () => {
    const { service, manager } = createService();
    const data: ProvinceData[] = [{ id: "ID-JB", value: 20, status: "Moderate" }];
    service.populateProvincePrecipitationData(data);
    expect(manager.populateProvincePrecipitationData).toHaveBeenCalledWith(data);
  });

  it("populates province temperature data via the manager", () => {
    const { service, manager } = createService();
    const data: ProvinceData[] = [{ id: "ID-BT", value: 30, status: "Warm" }];
    service.populateProvinceTemperatureData(data);
    expect(manager.populateProvinceTemperatureData).toHaveBeenCalledWith(data);
  });

  it("populates province severity data via the manager", () => {
    const { service, manager } = createService();
    const data: ProvinceData[] = [{ id: "ID-JT", value: 5, status: "Critical" }];
    service.populateProvinceSeverityData(data);
    expect(manager.populateProvinceSeverityData).toHaveBeenCalledWith(data);
  });

  it("delegates toggleLayers directly to the manager", () => {
    const { service, manager } = createService();
    service.toggleLayers(true, false, true, false, true, false, true);
    expect(manager.toggleLayers).toHaveBeenCalledWith(
      true,
      false,
      true,
      false,
      true,
      false,
      true,
    );
  });

  it("shows the humidity layer", () => {
    const { service, manager } = createService();
    service.showHumidityLayer();
    expect(manager.toggleLayers).toHaveBeenCalledWith(true, true, true, false, true, false, false);
  });

  it("hides the humidity layer", () => {
    const { service, manager } = createService();
    service.hideHumidityLayer();
    expect(manager.toggleLayers).toHaveBeenCalledWith(true, true, true, false, false, false, false);
  });

  it("shows the precipitation layer", () => {
    const { service, manager } = createService();
    service.showPrecipitationLayer();
    expect(manager.toggleLayers).toHaveBeenCalledWith(true, true, true, true, false, false, false);
  });

  it("hides the precipitation layer", () => {
    const { service, manager } = createService();
    service.hidePrecipitationLayer();
    expect(manager.toggleLayers).toHaveBeenCalledWith(true, true, true, false, false, false, false);
  });

  it("shows the temperature layer", () => {
    const { service, manager } = createService();
    service.showTemperatureLayer();
    expect(manager.toggleLayers).toHaveBeenCalledWith(true, true, true, false, false, true, false);
  });

  it("hides the temperature layer", () => {
    const { service, manager } = createService();
    service.hideTemperatureLayer();
    expect(manager.toggleLayers).toHaveBeenCalledWith(true, true, true, false, false, false, false);
  });

  it("shows the severity layer", () => {
    const { service, manager } = createService();
    service.showSeverityLayer();
    expect(manager.toggleLayers).toHaveBeenCalledWith(true, true, true, false, false, false, true);
  });

  it("hides the severity layer", () => {
    const { service, manager } = createService();
    service.hideSeverityLayer();
    expect(manager.toggleLayers).toHaveBeenCalledWith(true, true, true, false, false, false, false);
  });

  it("hides all thematic layers", () => {
    const { service, manager } = createService();
    service.hideAllLayers();
    expect(manager.toggleLayers).toHaveBeenCalledWith(true, true, true, false, false, false, false);
  });
});