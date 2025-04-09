const root = {
  setThemes: jest.fn(),
  container: {
    children: {
      push: jest.fn().mockImplementation((chart) => chart)
    }
  },
  dispose: jest.fn(),
  verticalLayout: { id: 'verticalLayout' }
};

module.exports = {
  __esModule: true,
  Root: {
    new: jest.fn().mockReturnValue(root)
  },
  Container: {
    new: jest.fn().mockImplementation(() => ({
      children: { push: jest.fn() },
      events: { on: jest.fn() }
    }))
  },
  Circle: {
    new: jest.fn().mockImplementation(() => ({}))
  },
  Label: {
    new: jest.fn().mockImplementation(() => ({}))
  },
  Bullet: {
    new: jest.fn().mockImplementation(() => ({ sprite: {} }))
  },
  color: jest.fn().mockImplementation((color) => ({ color })),
  percent: jest.fn().mockImplementation((value) => `${value}%`),
  p50: 0.5,
  
  // Add XYChart related mocks
  XYChart: {
    new: jest.fn().mockImplementation(() => ({
      series: { push: jest.fn() },
      xAxes: { push: jest.fn() },
      yAxes: { push: jest.fn() }
    }))
  },
  DateAxis: {
    new: jest.fn().mockImplementation(() => ({
      set: jest.fn(),
      get: jest.fn()
    }))
  },
  ValueAxis: {
    new: jest.fn().mockImplementation(() => ({
      set: jest.fn(),
      get: jest.fn()
    }))
  },
  LineSeries: {
    new: jest.fn().mockImplementation(() => ({
      data: { setAll: jest.fn() },
      set: jest.fn(),
      get: jest.fn(),
      fills: { template: { set: jest.fn() } },
      strokes: { template: { set: jest.fn() } },
      bullets: { push: jest.fn() }
    }))
  },
  Legend: {
    new: jest.fn().mockImplementation(() => ({
      data: { setAll: jest.fn() },
      labels: { template: { set: jest.fn() } }
    }))
  },
  settings: {
    get: jest.fn()
  },
  registry: {
    getType: jest.fn()
  }
};

module.exports = {
  __esModule: true,
  PieChart: {
    new: jest.fn().mockImplementation(() => ({
      series: {
        push: jest.fn().mockImplementation((series) => series)
      },
      children: {
        push: jest.fn().mockImplementation((child) => child)
      }
    }))
  },
  PieSeries: {
    new: jest.fn().mockImplementation(() => ({
      data: {
        setAll: jest.fn()
      },
      labels: {
        template: {
          setAll: jest.fn()
        }
      },
      ticks: {
        template: {
          setAll: jest.fn()
        }
      },
      slices: {
        template: {
          setAll: jest.fn()
        }
      },
      states: {
        create: jest.fn()
      }
    }))
  }
};

module.exports = {
  __esModule: true,
  default: {
    new: jest.fn().mockReturnValue({
      get: jest.fn(),
      set: jest.fn()
    })
  }
};