const tracer = {
  setName: jest.fn(),
  save: jest.fn(),
};

const agent = {
  setCustomAttribute: jest.fn(),
  setUserId: jest.fn(),
  setPageViewName: jest.fn(),
  addPageAction: jest.fn(),
  noticeError: jest.fn(),
  setCurrentRouteName: jest.fn(),
  recordMetric: jest.fn(),
  interaction: jest.fn(() => tracer),
};

describe("newRelicUtils", () => {
  let utils: typeof import("../../app/utils/newRelicUtils");

  beforeEach(() => {
    jest.resetModules();
    (global as any).window = window ?? ({} as any);
    (global as any).window.newrelic = agent;
    jest.clearAllMocks();
    tracer.setName.mockClear();
    tracer.save.mockClear();
    utils = require("../../app/utils/newRelicUtils");
  });

  test("invokes browser agent when available", () => {
    const {
      setCustomAttribute,
      setUserId,
      setPageViewName,
      addPageAction,
      noticeError,
      setCurrentRouteName,
      recordMetric,
      createInteraction,
    } = utils;

    setCustomAttribute("env", "test");
    setUserId("abc");
    setPageViewName("Dashboard", "example.com");
    addPageAction("click", { target: "button" });
    noticeError("boom");
    setCurrentRouteName("route");
    recordMetric("loadTime", 123);
    const stop = createInteraction("load");
    stop();

    expect(agent.setCustomAttribute).toHaveBeenCalledWith("env", "test");
    expect(agent.setUserId).toHaveBeenCalledWith("abc");
    expect(agent.setPageViewName).toHaveBeenCalledWith("Dashboard", "example.com");
    expect(agent.addPageAction).toHaveBeenCalledWith("click", { target: "button" });
    expect(agent.noticeError).toHaveBeenCalledWith("boom", undefined);
    expect(agent.setCurrentRouteName).toHaveBeenCalledWith("route");
    expect(agent.recordMetric).toHaveBeenCalledWith("loadTime", 123);
    expect(agent.interaction).toHaveBeenCalled();
    expect(tracer.setName).toHaveBeenCalledWith("load");
    expect(tracer.save).toHaveBeenCalled();
  });

  test("no-ops gracefully when agent missing", () => {
    jest.resetModules();
    (global as any).window = {};
    const { setCustomAttribute, createInteraction } = require("../../app/utils/newRelicUtils");
    expect(() => {
      setCustomAttribute("env", "test");
      const end = createInteraction("noop");
      end();
    }).not.toThrow();
  });
});
