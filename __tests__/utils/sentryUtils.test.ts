describe("sentryUtils wrappers", () => {
  const loadUtils = () => require("../../app/utils/sentryUtils");

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("proxies helpers to Sentry SDK", () => {
    jest.doMock("@sentry/nextjs", () => ({
      setUser: jest.fn(),
      addBreadcrumb: jest.fn(),
      setTag: jest.fn(),
      setExtra: jest.fn(),
      captureMessage: jest.fn(),
      startTransaction: jest.fn().mockReturnValue({ id: 1 }),
      SeverityLevel: {} as any,
    }));

    const {
      setUserContext,
      clearUserContext,
      addBreadcrumb,
      setTag,
      setExtra,
      captureMessage,
      startTransaction,
    } = loadUtils();

    setUserContext({ id: "1" });
    clearUserContext();
    addBreadcrumb("clicked", "ui", "info", { id: 2 });
    setTag("env", "test");
    setExtra("foo", "bar");
    captureMessage("hello", "warning");
    const txn = startTransaction("load", "ui");

    const sentry = require("@sentry/nextjs");
    expect(sentry.setUser).toHaveBeenNthCalledWith(1, { id: "1" });
    expect(sentry.setUser).toHaveBeenNthCalledWith(2, null);
    expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ message: "clicked" })
    );
    expect(sentry.setTag).toHaveBeenCalledWith("env", "test");
    expect(sentry.setExtra).toHaveBeenCalledWith("foo", "bar");
    expect(sentry.captureMessage).toHaveBeenCalledWith("hello", "warning");
    expect(txn).toEqual({ id: 1 });
  });

  test("falls back to startSpanManual when startTransaction unavailable", () => {
    const manual = jest.fn().mockReturnValue({ end: jest.fn() });
    jest.doMock("@sentry/nextjs", () => ({
      startSpanManual: manual,
      SeverityLevel: {} as any,
    }));

    const { startTransaction } = loadUtils();
    const span = startTransaction("fetch", "api");
    expect(manual).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "fetch",
        attributes: { "span.op": "api" },
        op: "api",
      })
    );
    expect(span).toEqual({ end: expect.any(Function) });
  });

  test("returns undefined when no transaction helpers exist", () => {
    jest.doMock("@sentry/nextjs", () => ({
      SeverityLevel: {} as any,
    }));
    const { startTransaction } = loadUtils();
    expect(startTransaction("noop", "none")).toBeUndefined();
  });
});
