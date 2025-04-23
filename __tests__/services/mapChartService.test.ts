import { MapChartService } from "../../services/mapChartService";
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import { MapConfig } from "../../types";

const mockChildrenPush = jest.fn();
const mockEventsOn = jest.fn();
const mockBulletsPush = jest.fn();
const mockSeriesPush = jest.fn();
const mockGoHome = jest.fn();
const mockDataPush = jest.fn();
const mockDataClear = jest.fn();
const mockZoomToGeoPoint = jest.fn();

// Common mock implementations
const mockHomeButton = { set: jest.fn() };
const mockZoomControl = { homeButton: mockHomeButton };

const commonMockImplementations = {
  circle: (root: any, config: any) => ({
    root,
    config,
    type: "Circle",
    dispose: jest.fn(),
    events: {
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === "pointerover") {
          callback({ target: { dataItem: { dataContext: { id: "test-id" } } } });
        }
      })
    }
  }),
  bullet: (root: any, config: any) => ({
    root,
    sprite: config.sprite,
    type: "Bullet",
    config,
  }),
  tooltip: (root: any, config: any) => ({
    root,
    config,
    type: "Tooltip",
    show: jest.fn(),
    hide: jest.fn(),
    set: jest.fn(),
  }),
  rectangle: (root: any, config: any) => ({
    root,
    config,
    type: "Rectangle",
  }),
};

// Common test setup patterns
const commonTestSetup = {
  createMockSeries: () => ({
    bullets: { push: mockBulletsPush },
    data: { 
      push: mockDataPush,
      clear: mockDataClear
    },
    set: jest.fn(),
    zoomToCluster: jest.fn(),
  }),
  createMockChart: () => ({
    series: { push: mockSeriesPush.mockImplementation((series) => series) },
    set: jest.fn().mockImplementation((prop, value) => (prop === "zoomControl" ? mockZoomControl : null)),
    appear: jest.fn(),
    goHome: mockGoHome,
    zoomToGeoPoint: mockZoomToGeoPoint
  }),
};

// Update the mock implementations to use common patterns
jest.mock("@amcharts/amcharts5", () => {
  const originalModule = jest.requireActual("@amcharts/amcharts5");
  return {
    __esModule: true,
    ...originalModule,
    Root: {
      new: jest.fn().mockImplementation(() => ({
        setThemes: jest.fn(),
        container: {
          children: {
            push: jest.fn().mockImplementation((chart) => chart),
          },
        },
        dispose: jest.fn(),
      })),
    },
    Container: {
      new: jest.fn().mockImplementation(() => ({
        children: { push: mockChildrenPush },
        events: { on: mockEventsOn },
      })),
    },
    Circle: {
      new: jest.fn().mockImplementation((root, config) => commonMockImplementations.circle(root, config)),
    },
    Label: {
      new: jest.fn().mockImplementation((root, config) => ({ root, config })),
    },
    Bullet: {
      new: jest.fn().mockImplementation((root, config) => commonMockImplementations.bullet(root, config)),
    },
    Tooltip: {
      new: jest.fn().mockImplementation((root, config) => commonMockImplementations.tooltip(root, config)),
    },
    Rectangle: {
      new: jest.fn().mockImplementation((root, config) => commonMockImplementations.rectangle(root, config)),
    },
    color: jest.fn().mockImplementation((color) => ({ color })),
    p50: 0.5,
  };
});

jest.mock("@amcharts/amcharts5/map", () => {
  const mockHomeButton = { set: jest.fn() };
  const mockZoomControl = { homeButton: mockHomeButton };
  return {
    __esModule: true,
    MapChart: {
      new: jest.fn().mockImplementation(() => commonTestSetup.createMockChart()),
    },
    MapPolygonSeries: {
      new: jest.fn().mockImplementation(() => ({
        mapPolygons: { template: { setAll: jest.fn() } },
        events: { on: jest.fn().mockImplementation((event, cb) => { if (event === "datavalidated") cb(); }) },
      })),
    },
    MapPointSeries: {
      new: jest.fn().mockImplementation(() => commonTestSetup.createMockSeries()),
    },
    ClusteredPointSeries: {
      new: jest.fn().mockImplementation((root, config) => ({
        ...commonTestSetup.createMockSeries(),
        zoomToCluster: jest.fn(),
        config: {
          groupIdField: "province",
          minDistance: 20,
          scatterDistance: 20,
          scatterRadius: 20,
          stopClusterZoom: 10
        }
      })),
    },
    ZoomControl: {
      new: jest.fn().mockImplementation(() => ({
        homeButton: {
          set: jest.fn()
        }
      })),
    },
    geoMercator: jest.fn().mockReturnValue({}),
  };
});

jest.mock("@amcharts/amcharts5/themes/Animated", () => ({
  __esModule: true,
  default: { new: jest.fn().mockReturnValue({}) },
}));

jest.mock("@amcharts/amcharts5-geodata/indonesiaLow", () => ({
  __esModule: true,
  default: {},
}));

// Helper to override a method to throw an error once and return a restore function.
function overrideMethod(target: any, property: string, errorMsg: string): () => void {
  if (!target) {
    throw new Error(`Cannot override method on null/undefined target: ${property}`);
  }
  const original = target[property];
  target[property] = jest.fn().mockImplementationOnce(() => { throw new Error(errorMsg); });
  return () => { target[property] = original; };
}

// Helper for early-return tests.
const testEarlyReturn = (
  mapService: MapChartService,
  methodName: string,
  nullProps: Partial<Record<string, any>> = { chart: null, root: null }
) => {
  const spy = jest.spyOn(mapService as any, methodName);
  Object.keys(nullProps).forEach((prop) => ((mapService as any)[prop] = nullProps[prop]));
  (mapService as any)[methodName]();
  expect(spy).toHaveReturned();
};

// Helper for error-handling tests (with a small delay to allow async logging).
async function expectErrorHandling(
  methodCall: () => void,
  expectedConsoleMsg: string,
  expectedOnErrorMsg: string | null = null,
  delay = 10,
  onErrorMock?: jest.Mock
) {
  const consoleSpy = jest.spyOn(console, "error").mockImplementation();
  methodCall();
  await new Promise((resolve) => setTimeout(resolve, delay));
  expect(consoleSpy).toHaveBeenCalledWith(expectedConsoleMsg, expect.any(Error));
  if (expectedOnErrorMsg && onErrorMock) {
    expect(onErrorMock).toHaveBeenCalledWith(expectedOnErrorMsg);
  }
  consoleSpy.mockRestore();
}

// Helper untuk setup fake objects yang sering digunakan
function createFakeObjects() {
  const fakeRoot = { dispose: jest.fn() } as any;
  const fakePointSeries = commonTestSetup.createMockSeries() as any;
  const fakeCircle = commonMockImplementations.circle(null, {}) as any;
  const fakeTooltip = commonMockImplementations.tooltip(null, {}) as any;
  const fakeBullet = commonMockImplementations.bullet(null, {}) as any;
  const fakeRectangle = commonMockImplementations.rectangle(null, {}) as any;

  return {
    fakeRoot,
    fakePointSeries,
    fakeCircle,
    fakeTooltip,
    fakeBullet,
    fakeRectangle
  };
}

// Helper untuk mock amcharts objects
function mockAmchartsObjects(fakes: ReturnType<typeof createFakeObjects>) {
  const originalCircleNew = am5.Circle.new;
  const originalBulletNew = am5.Bullet.new;
  const originalTooltipNew = am5.Tooltip.new;
  const originalRectangleNew = am5.Rectangle.new;

  am5.Circle.new = jest.fn().mockReturnValue(fakes.fakeCircle);
  am5.Bullet.new = jest.fn().mockReturnValue(fakes.fakeBullet);
  am5.Tooltip.new = jest.fn().mockReturnValue(fakes.fakeTooltip);
  am5.Rectangle.new = jest.fn().mockReturnValue(fakes.fakeRectangle);

  return () => {
    am5.Circle.new = originalCircleNew;
    am5.Bullet.new = originalBulletNew;
    am5.Tooltip.new = originalTooltipNew;
    am5.Rectangle.new = originalRectangleNew;
  };
}

// Helper untuk setup regular bullet test
function setupRegularBulletTest() {
  const fakes = createFakeObjects();
  const restore = mockAmchartsObjects(fakes);
  
  const service = new MapChartService();
  (service as any).root = fakes.fakeRoot;
  (service as any).pointSeries = fakes.fakePointSeries;

  return {
    service,
    fakeRoot: fakes.fakeRoot,
    fakePointSeries: fakes.fakePointSeries,
    restore
  };
}

describe("MapChartService", () => {
  let mapService: MapChartService;
  const mockConfig: MapConfig = {
    zoomLevel: 5,
    centerPoint: { longitude: 120, latitude: -5 },
  };

  beforeEach(() => {
    document.body.innerHTML = '<div id="chartdiv"></div>';
    jest.clearAllMocks();
    mapService = new MapChartService();
  });

  afterEach(() => {
    mapService.dispose();
  });

  // Initialization tests.
  test("initialize creates root and chart elements", () => {
    mapService.initialize("chartdiv", mockConfig);
    expect(am5.Root.new).toHaveBeenCalledWith("chartdiv");
    expect(am5map.MapChart.new).toHaveBeenCalled();
  });

  test("initialize applies correct chart settings", () => {
    const customConfig: MapConfig = {
      zoomLevel: 10,
      centerPoint: { longitude: 130, latitude: -8 },
    };
    mapService.initialize("chartdiv", customConfig);
    expect(am5map.MapChart.new).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        homeZoomLevel: 10,
        homeGeoPoint: { longitude: 130, latitude: -8 },
      })
    );
  });

  test("initialize applies animated theme", () => {
    mapService.initialize("chartdiv", mockConfig);
    expect((mapService as any).root.setThemes).toHaveBeenCalled();
  });

  test("initialize calls onError when container is not found", () => {
    const onErrorMock = jest.fn();
    const originalGetElementById = document.getElementById;
    document.getElementById = jest.fn().mockReturnValue(null);
    mapService = new MapChartService(onErrorMock);
    mapService.initialize("non-existent-id", mockConfig);
    expect(onErrorMock).toHaveBeenCalledWith("Failed to load the map. Please try again.");
    document.getElementById = originalGetElementById;
  });

  // Early-return tests.
  const earlyReturnCases = [
    { method: "setupZoomControl", nullProps: { chart: null, root: null } },
    { method: "setupPolygonSeries", nullProps: { chart: null, root: null } },
    { method: "setupPointSeries", nullProps: { chart: null, root: null } },
    { method: "populateLocations", nullProps: { pointSeries: null } },
    { method: "setupClusterBullet", nullProps: { chart: null, root: null } },
    { method: "setupRegularBullet", nullProps: { pointSeries: null, root: null } },
  ];
  test.each(earlyReturnCases)(
    "$method returns early if specified properties are null",
    ({ method, nullProps }) => {
      testEarlyReturn(mapService, method, nullProps);
    }
  );

  // Functional tests.
  test("setupZoomControl adds zoom control to chart", () => {
    const mockSet = jest.fn();
    const mockHomeButton = { set: mockSet };
    const mockZoomControl = { homeButton: mockHomeButton };
    const mockZoomControlNew = jest.fn().mockReturnValue(mockZoomControl);
    
    // Mock the ZoomControl.new function before initializing
    jest.spyOn(am5map.ZoomControl, 'new').mockImplementation(mockZoomControlNew);

    // Mock the chart.set method
    const mockChartSet = jest.fn().mockReturnValue(mockZoomControl);
    (mapService as any).chart = { set: mockChartSet, on: jest.fn() };
    (mapService as any).root = { dispose: jest.fn() };

    // Call setupZoomControl directly since we've mocked the dependencies
    (mapService as any).setupZoomControl();

    expect(mockChartSet).toHaveBeenCalledWith("zoomControl", mockZoomControl);
    expect(mockSet).toHaveBeenCalledWith("visible", true);
  });

  test("setupPolygonSeries adds polygon series to chart", () => {
    mapService.initialize("chartdiv", mockConfig);
    const spy = jest.spyOn(mapService as any, "setupPolygonSeries");
    (mapService as any).setupPolygonSeries();
    expect(spy).toHaveBeenCalled();
    expect(am5map.MapPolygonSeries.new).toHaveBeenCalled();
  });

  test("setupPointSeries adds clustered point series to chart", () => {
    mapService.initialize("chartdiv", mockConfig);
    const spy = jest.spyOn(mapService as any, "setupPointSeries");
    (mapService as any).setupPointSeries();
    expect(spy).toHaveBeenCalled();
    expect(am5map.ClusteredPointSeries.new).toHaveBeenCalled();
    expect(am5map.ClusteredPointSeries.new).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        groupIdField: "province",
        scatterDistance: 20
      })
    );
  });

    // Update the populateLocations tests
  test("populateLocations adds location data to point series", () => {
    mapService.initialize("chartdiv", mockConfig);
    
    // Mock the pointSeries properly
    (mapService as any).pointSeries = {
      data: {
        push: jest.fn(),
        clear: jest.fn(),
        values: () => []
      }
    };
    
    const locations = [
      { 
        location__latitude: -6.2, 
        location__longitude: 106.8, 
        city: "Jakarta", 
        id: "1",
        location__province: "DKI Jakarta" 
      },
      { 
        location__latitude: -7.8, 
        location__longitude: 110.4, 
        city: "Yogyakarta", 
        id: "2",
        location__province: "DI Yogyakarta" 
      },
    ];
    
    mapService.populateLocations(locations);
    expect((mapService as any).pointSeries.data.push).toHaveBeenCalledTimes(2);
  });

  test("populateLocations with empty array should not cause errors", () => {
    mapService.initialize("chartdiv", mockConfig);
    
    // Mock the pointSeries properly
    (mapService as any).pointSeries = {
      data: {
        push: jest.fn(),
        clear: jest.fn(),
        values: () => []
      }
    };
    
    mapService.populateLocations([]);
    expect((mapService as any).pointSeries.data.push).not.toHaveBeenCalled();
  });

  // Update the error handling tests
  test("setupClusterBullet handles error (withOnError: true)", async () => {
    const onErrorMock = jest.fn();
    mapService = new MapChartService(onErrorMock);
    mapService.initialize("chartdiv", mockConfig);
    
    // Properly mock pointSeries before testing
    (mapService as any).pointSeries = {
      set: jest.fn().mockImplementationOnce(() => {
        throw new Error("Test cluster bullet error");
      }),
      data: { push: jest.fn(), clear: jest.fn() }
    };
    
    await expectErrorHandling(
      () => (mapService as any).setupClusterBullet(),
      "Error setting up cluster bullet:",
      "Error setting up cluster bullet.",
      10,
      onErrorMock
    );
  });

  test("setupClusterBullet without onError handles error (withOnError: false)", async () => {
    mapService = new MapChartService();
    mapService.initialize("chartdiv", mockConfig);
    
    // Properly mock pointSeries before testing
    (mapService as any).pointSeries = {
      set: jest.fn().mockImplementationOnce(() => {
        throw new Error("Test cluster bullet error");
      }),
      data: { push: jest.fn(), clear: jest.fn() }
    };
    
    await expectErrorHandling(
      () => (mapService as any).setupClusterBullet(),
      "Error setting up cluster bullet:"
    );
  });

  // Update the createLocationMarker test
  test("createLocationMarker adds marker series with bullet types", () => {
    mapService.initialize("chartdiv", mockConfig);
    (mapService as any).createLocationMarker();
    
    // Check that map point series was created
    expect(am5map.MapPointSeries.new).toHaveBeenCalled();
    expect(mockSeriesPush).toHaveBeenCalled();
    
    // Check that bullets were added
    expect(mockBulletsPush).toHaveBeenCalledTimes(2);
    
    // Test bullet creation
    const bulletFactories = mockBulletsPush.mock.calls.map(call => call[0]);
    bulletFactories.forEach(factory => {
      expect(typeof factory).toBe("function");
    });
  });


  test("chart handles extreme zoom levels", () => {
    const extremeZoomConfig: MapConfig = {
      zoomLevel: 100,
      centerPoint: { longitude: 120, latitude: -5 },
    };
    mapService.initialize("chartdiv", extremeZoomConfig);
    expect(am5map.MapChart.new).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ homeZoomLevel: 100 })
    );
  });

  test("dispose cleans up resources", () => {
    mapService.initialize("chartdiv", mockConfig);
    mapService.dispose();
    expect((mapService as any).root).toBeNull();
  });

  // Combined parameterized error-handling tests.
  const errorTestCases = [
    {
      name: "setupPolygonSeries",
      method: "setupPolygonSeries",
      override: () =>
        overrideMethod(am5map.MapPolygonSeries, "new", "Test polygon series error"),
      expectedConsole: "Error setting up polygon series:",
      expectedOnError: "Error setting up map polygons.",
      withOnError: true,
    },
    {
      name: "setupPointSeries",
      method: "setupPointSeries",
      override: () =>
        overrideMethod(am5map.ClusteredPointSeries, "new", "Test point series error"),
      expectedConsole: "Error setting up point series:",
      expectedOnError: "Error setting up map points.",
      withOnError: true,
    },
    {
      name: "setupClusterBullet",
      method: "setupClusterBullet",
      override: () =>
        overrideMethod((mapService as any).pointSeries, "set", "Test cluster bullet error"),
      expectedConsole: "Error setting up cluster bullet:",
      expectedOnError: "Error setting up cluster bullet.",
      withOnError: true,
    },

    {
      name: "setupClusterBullet without onError",
      method: "setupClusterBullet",
      override: () =>
        overrideMethod((mapService as any).pointSeries, "set", "Test cluster bullet error"),
      expectedConsole: "Error setting up cluster bullet:",
      withOnError: false,
    },
    {
      name: "setupPointSeries without onError",
      method: "setupPointSeries",
      override: () =>
        overrideMethod((mapService as any).chart.series, "push", "Test point series error"),
      expectedConsole: "Error setting up point series:",
      withOnError: false,
    },
    {
      name: "setupPolygonSeries without onError",
      method: "setupPolygonSeries",
      override: () =>
        overrideMethod((mapService as any).chart.series, "push", "Test polygon series error"),
      expectedConsole: "Error setting up polygon series:",
      withOnError: false,
    },
    {
      name: "initialize without onError",
      method: "initialize",
      override: () => {
        const original = document.getElementById;
        document.getElementById = jest.fn().mockReturnValue(null);
        return () => { document.getElementById = original; };
      },
      expectedConsole: "Error initializing map:",
      withOnError: false,
    },
  ];

  test.each(errorTestCases)(
    "$name handles error (withOnError: $withOnError)",
    async ({ method, override, expectedConsole, expectedOnError, withOnError }) => {
      const onErrorMock = withOnError ? jest.fn() : undefined;
      mapService = withOnError ? new MapChartService(onErrorMock) : new MapChartService();
      mapService.initialize("chartdiv", mockConfig);
      
      // Initialize pointSeries for setupClusterBullet tests
      if (method === "setupClusterBullet") {
        (mapService as any).pointSeries = {
          set: jest.fn(),
          bullets: { push: jest.fn() }
        };
      }
      
      const restore = override();
      const callMethod = method === "initialize" 
        ? () => (mapService as any)[method]("chartdiv", mockConfig)
        : () => (mapService as any)[method]();
      await expectErrorHandling(callMethod, expectedConsole, expectedOnError ?? null, 10, onErrorMock);
      restore();
    }
  );

  // Test for setupRegularBullet
  describe("setupRegularBullet", () => {
    it("sets up regular bullet with correct configuration", () => {
      const { service, fakeRoot, fakePointSeries } = setupRegularBulletTest();
      (service as any).pointSeries = fakePointSeries;
      (service as any).root = fakeRoot;
      
      (service as any).setupRegularBullet();
      
      expect(am5.Tooltip.new).toHaveBeenCalledWith(fakeRoot, {
        getFillFromSprite: false,
        background: expect.any(Object),
        labelText: "",
        autoTextColor: false,
        interactive: true,
      });
      
      expect(fakePointSeries.bullets.push).toHaveBeenCalled();
      expect(fakePointSeries.set).toHaveBeenCalledWith("tooltip", expect.any(Object));
    });

    it("handles missing pointSeries or root", () => {
      const { service } = setupRegularBulletTest();
      
      // Reset mocks before test
      jest.clearAllMocks();
      
      // Ensure both pointSeries and root are null
      (service as any).pointSeries = null;
      (service as any).root = null;
      
      (service as any).setupRegularBullet();
      
      expect(am5.Tooltip.new).not.toHaveBeenCalled();
      expect(am5.Bullet.new).not.toHaveBeenCalled();
    });
  });

  // Test for populateLocations with mocked data.clear method
  test("populateLocations clears previous data before adding new locations", () => {
    // Setup
    const locations = [
      { 
        location__latitude: -6.2, 
        location__longitude: 106.8, 
        city: "Jakarta", 
        id: "1",
        location__province: "DKI Jakarta" 
      },
      { 
        location__latitude: -7.8, 
        location__longitude: 110.4, 
        city: "Yogyakarta", 
        id: "2",
        location__province: "DI Yogyakarta" 
      },
    ];
    
    mapService.initialize("chartdiv", mockConfig);
    
    // Mock pointSeries with clear method
    (mapService as any).pointSeries = {
      data: {
        clear: jest.fn(),
        push: jest.fn()
      }
    };
    
    // Act
    mapService.populateLocations(locations);
    
    // Assert
    expect((mapService as any).pointSeries.data.clear).toHaveBeenCalled();
    expect((mapService as any).pointSeries.data.push).toHaveBeenCalledTimes(2);
  });
});