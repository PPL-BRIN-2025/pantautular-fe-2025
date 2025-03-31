const originalModule = jest.requireActual("@amcharts/amcharts5");

module.exports = {
  __esModule: true,
  ...originalModule,
  Root: {
    new: jest.fn().mockImplementation(() => ({
      setThemes: jest.fn(),
      container: {
        children: {
          push: jest.fn().mockImplementation((chart) => chart)
        }
      },
      dispose: jest.fn()
    }))
  },
  Container: {
    new: jest.fn().mockImplementation(() => ({
      children: {
        push: jest.fn()
      },
      events: {
        on: jest.fn()
      }
    }))
  },
  Circle: {
    new: jest.fn().mockImplementation(() => ({}))
  },
  Label: {
    new: jest.fn().mockImplementation(() => ({}))
  },
  Bullet: {
    new: jest.fn().mockImplementation(() => ({
      sprite: {}
    }))
  },
  color: jest.fn().mockImplementation((color) => ({ color })),
  p50: 0.5
};