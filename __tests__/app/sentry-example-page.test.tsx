import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockDiagnose = jest.fn().mockResolvedValue("ok");
const mockStartSpan = jest.fn((ctx: any, cb: () => Promise<void> | void) => cb());

jest.mock("next/head", () => {
  const React = require("react");
  return ({ children }: { children: React.ReactNode }) => (
    <>
      {React.Children.toArray(children).filter((child: any) => child?.type !== "style")}
    </>
  );
});

jest.mock("@sentry/nextjs", () => ({
  diagnoseSdkConnectivity: (...args: any[]) => mockDiagnose(...args),
  startSpan: (...args: any[]) => mockStartSpan(...args),
}));

jest.mock("../../app/utils/sentryUtils", () => ({
  addBreadcrumb: jest.fn(),
  setUserContext: jest.fn(),
  setTag: jest.fn(),
}));

const sentryHelpers = require("../../app/utils/sentryUtils");

describe("sentry example page", () => {
  let styleDescriptor: PropertyDescriptor | undefined;

  beforeAll(() => {
    const styleProto = Object.getPrototypeOf(document.createElement("style"));
    styleDescriptor = Object.getOwnPropertyDescriptor(styleProto, "textContent");
    Object.defineProperty(styleProto, "textContent", {
      configurable: true,
      get() {
        return "";
      },
      set() {
        // no-op to avoid jsdom CSS parsing errors
      },
    });
  });

  afterAll(() => {
    if (styleDescriptor) {
      const styleProto = Object.getPrototypeOf(document.createElement("style"));
      Object.defineProperty(styleProto, "textContent", styleDescriptor);
    }
  });

  let consoleErrorSpy: jest.SpyInstance | null = null;

  beforeEach(() => {
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: false });
    mockDiagnose.mockClear();
    mockStartSpan.mockClear();
    Object.values(sentryHelpers).forEach((fn) => typeof fn === "function" && fn.mockClear());
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
    consoleErrorSpy = null;
  });

  test("sets up Sentry context on mount and handles button click", async () => {
    const Page = require("../../app/sentry-example-page/page").default;
    render(<Page />);

    await waitFor(() => expect(mockDiagnose).toHaveBeenCalled());
    expect(sentryHelpers.setUserContext).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "demo-user-123",
        role: "tester",
      })
    );
    expect(sentryHelpers.setTag).toHaveBeenCalledWith("page", "sentry-example");
    expect(sentryHelpers.addBreadcrumb).toHaveBeenCalledWith("Page loaded", "navigation");

    const button = screen.getByRole("button", { name: /Throw Sample Error/i });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/sentry-example-api");
    expect(mockStartSpan).toHaveBeenCalled();
    expect(sentryHelpers.addBreadcrumb).toHaveBeenCalledWith(
      "Error button clicked",
      "ui.click",
      "info",
      expect.objectContaining({ buttonId: "throw-error-button" })
    );
    await screen.findByText(/Sample error was sent/i);
  });

  test("shows connectivity warning when SDK cannot reach Sentry", async () => {
    mockDiagnose.mockResolvedValueOnce("sentry-unreachable");
    const Page = require("../../app/sentry-example-page/page").default;
    render(<Page />);

    await screen.findByText(/not able to reach Sentry/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
