const createMock = (methods) => {
  const mock = {};
  methods.forEach((method) => {
    mock[method] = jest.fn();
  });
  return mock;
};

module.exports = {
  __esModule: true,
  MapChart: {
    new: jest.fn().mockImplementation(() => ({
      series: { 
        push: jest.fn((series) => series),
        values: () => [] // Add array-like behavior
      },
      children: { push: jest.fn((child) => child) },
      ...createMock(["set", "appear", "goHome", "zoomToGeoPoint", "dispose"]),
      events: { on: jest.fn() }
    })),
  },
  MapPolygonSeries: {
    new: jest.fn().mockImplementation(() => ({
      mapPolygons: { template: { setAll: jest.fn() } },
      events: {
        on: jest.fn((event, callback) => {
          if (event === "datavalidated") setTimeout(callback, 0);
        }),
      },
      data: { setAll: jest.fn() },
      ...createMock(["set", "dispose"])
    })),
  },
  MapPointSeries: {
    new: jest.fn().mockImplementation(() => ({
      bullets: { push: jest.fn((factory) => factory()) },
      data: { push: jest.fn(), clear: jest.fn(), values: () => [] },
      events: { on: jest.fn() },
      ...createMock(["set", "dispose"])
    })),
  },
  ClusteredPointSeries: {
    new: jest.fn().mockImplementation(() => ({
      bullets: { push: jest.fn((factory) => factory()) },
      data: { push: jest.fn(), clear: jest.fn(), values: () => [] },
      events: { on: jest.fn() },
      ...createMock(["set", "zoomToCluster", "dispose"])
    })),
  },
  ZoomControl: {
    new: jest.fn().mockImplementation(() => ({
      homeButton: { 
        set: jest.fn(),
        events: { on: jest.fn() }
      },
      ...createMock(["dispose"])
    })),
  },
  geoMercator: jest.fn().mockReturnValue({}),
};