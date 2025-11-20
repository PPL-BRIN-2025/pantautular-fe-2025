import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("next/link", () => {
  const React = require("react");
  return React.forwardRef(({ href, children, ...rest }: any, _ref) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ));
});

describe("app shell coverage helpers", () => {
  test("_document injects monitoring script", () => {
    let tree: React.ReactNode = null;
    jest.isolateModules(() => {
      jest.doMock("next/document", () => {
        const React = require("react");
        class BaseDocument extends React.Component {
          render() {
            return React.createElement("html", null, this.props.children);
          }
        }
        const Html = ({ children }: { children: React.ReactNode }) => <html>{children}</html>;
        const Head = ({ children }: { children: React.ReactNode }) => <head>{children}</head>;
        const Main = () => <main data-testid="next-main" />;
        const NextScript = () => <script data-testid="next-script" />;
        return { __esModule: true, default: BaseDocument, Html, Head, Main, NextScript };
      });
      const Document = require("../../app/_document").default;
      const instance = new Document({}, {}) as any;
      tree = instance.render();
    });
    const scriptNode = findNode(tree, (child) => child?.props?.src === "/js/new-relic.js");
    expect(scriptNode).not.toBeNull();
    jest.resetModules();
  });

  test("global-error captures exceptions and renders NextError", () => {
    let captureSpy: jest.SpyInstance;
    let markup = "";
    jest.isolateModules(() => {
      jest.doMock("next/error", () => () => <div data-testid="next-error" />);
      jest.doMock("react", () => {
        const actual = jest.requireActual("react");
        return { ...actual, useEffect: (fn: () => void) => fn() };
      });
      const sentry = require("@sentry/nextjs");
      captureSpy = jest.spyOn(sentry, "captureException").mockImplementation(() => {});
      const GlobalError = require("../../app/global-error").default;
      markup = renderToStaticMarkup(<GlobalError error={new Error("boom")} />);
    });
    expect(captureSpy).toHaveBeenCalled();
    expect(markup).toContain('data-testid="next-error"');
    jest.resetModules();
  });

  test("root layout composes providers and scripts", () => {
    const RootLayout = require("../../app/layout").default;
    const { AuthProvider } = require("../../app/auth/provider");
    const LogRocketInitializer = require("../../app/logrocket-client").default;
    const MicrosoftClarity = require("../../app/components/MicrosoftClarity").default;
    const tree = RootLayout({
      children: <div data-testid="child-slot">content</div>
    });
    const authProvider = findNode(tree, (child) => child?.type === AuthProvider);
    const logrocket = findNode(tree, (child) => child?.type === LogRocketInitializer);
    const clarity = findNode(tree, (child) => child?.type === MicrosoftClarity);
    const scriptNode = findNode(tree, (child) => child?.props?.src === "/js/new-relic.js");
    const childContent = findNode(tree, (child) => child?.props?.["data-testid"] === "child-slot");
    expect(authProvider).not.toBeNull();
    expect(logrocket).not.toBeNull();
    expect(clarity).not.toBeNull();
    expect(scriptNode).not.toBeNull();
    expect(childContent).not.toBeNull();
  });

  test("logrocket initializer identifies authenticated users", async () => {
    jest.resetModules();
    const identifySpy = jest.fn();
    jest.doMock("logrocket", () => ({ identify: identifySpy }));

    const logrocketUtils = require("../../utils/logrocket");
    const initSpy = jest.spyOn(logrocketUtils, "initLogRocket").mockImplementation(() => {});

    const authModule = require("../../app/auth/hooks/useAuth");
    const authSpy = jest.spyOn(authModule, "useAuth").mockReturnValue({
      user: { id: 5, name: "Ina", email: "ina@test", role: "ADMIN" }
    });

    const componentModule = require("../../app/logrocket-client");
    const Component = componentModule.default ?? componentModule;
    render(<Component />);

    await waitFor(() => {
      expect(initSpy).toHaveBeenCalled();
      expect(identifySpy).toHaveBeenCalledWith("5", expect.objectContaining({ name: "Ina" }));
    });
    initSpy.mockRestore();
    authSpy.mockRestore();
    jest.resetModules();
  });

  test("not-found page renders message and CTA", () => {
    const NotFound = require("../../app/not-found").default;
    render(<NotFound />);
    expect(screen.getByText(/Halaman Tidak Ditemukan/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kembali ke Beranda/i })).toHaveAttribute("href", "/");
  });
});

function findNode(
  node: React.ReactNode,
  predicate: (child: any) => boolean
): React.ReactNode | null {
  if (node == null || typeof node === "boolean") {
    return null;
  }

  if (typeof node !== "object") {
    return null;
  }

  if (predicate(node)) {
    return node;
  }

  const children = (node as any)?.props?.children;
  if (!children) {
    return null;
  }

  for (const child of React.Children.toArray(children)) {
    const match = findNode(child, predicate);
    if (match) {
      return match;
    }
  }

  return null;
}
