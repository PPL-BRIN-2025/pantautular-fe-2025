import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

jest.mock("@sentry/nextjs", () => {
  const mockFns = {
    setUser: jest.fn(),
    addBreadcrumb: jest.fn(),
    setTag: jest.fn(),
    setExtra: jest.fn(),
    captureMessage: jest.fn(),
    startTransaction: jest.fn(),
    startSpanManual: jest.fn().mockReturnValue({ end: jest.fn() }),
    diagnoseSdkConnectivity: jest.fn().mockResolvedValue("ok"),
    startSpan: jest.fn((_ctx, cb) => cb()),
  };
  return mockFns;
});

describe("sentry utils", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("route handler throws expected error type", () => {
    const route = require("../../app/api/sentry-example-api/route");
    expect(() => route.GET()).toThrow("This error is raised on the backend called by the example page.");
  });

  test("sentry example page handles button click", async () => {
    const Page = require("../../app/sentry-example-page/page").default;
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: false });
    const sentry = require("@sentry/nextjs");

    render(<Page />);

    await waitFor(() => expect(sentry.diagnoseSdkConnectivity).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /Throw Sample Error/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/api/sentry-example-api"));
  });

  test("new relic utils invoke window agent when available", () => {
    const agent = {
      setCustomAttribute: jest.fn(),
      setUserId: jest.fn(),
      setPageViewName: jest.fn(),
      addPageAction: jest.fn(),
      noticeError: jest.fn(),
      setCurrentRouteName: jest.fn(),
      recordMetric: jest.fn(),
      interaction: jest.fn(() => ({ setName: jest.fn(), save: jest.fn() })),
    };
    (window as any).newrelic = agent;

    const utils = require("../../app/utils/newRelicUtils");
    utils.setCustomAttribute("foo", "bar");
    utils.setUserId("123");
    utils.setPageViewName("Home", "example.com");
    utils.addPageAction("click", { id: 1 });
    utils.noticeError("err");
    utils.setCurrentRouteName("route");
    utils.recordMetric("Metric", 99);
    const interaction = utils.createInteraction("trace");
    interaction();

    expect(agent.setCustomAttribute).toHaveBeenCalledWith("foo", "bar");
    expect(agent.setUserId).toHaveBeenCalledWith("123");
    expect(agent.recordMetric).toHaveBeenCalledWith("Metric", 99);
    delete (window as any).newrelic;
  });

  test("sentry utility functions call Sentry SDK", () => {
    const sentry = require("@sentry/nextjs");
    const utils = require("../../app/utils/sentryUtils");

    utils.setUserContext({ id: "A" });
    utils.clearUserContext();
    utils.addBreadcrumb("hello", "ui", "error", { foo: "bar" });
    utils.setTag("env", "test");
    utils.setExtra("info", 1);
    utils.captureMessage("msg", "warning");
    utils.startTransaction("txn", "op");

    expect(sentry.setUser).toHaveBeenNthCalledWith(1, { id: "A" });
    expect(sentry.setUser).toHaveBeenNthCalledWith(2, null);
    expect(sentry.addBreadcrumb).toHaveBeenCalledWith({ message: "hello", category: "ui", level: "error", data: { foo: "bar" } });
    expect(sentry.setTag).toHaveBeenCalledWith("env", "test");
    expect(sentry.captureMessage).toHaveBeenCalledWith("msg", "warning");
  });
});
