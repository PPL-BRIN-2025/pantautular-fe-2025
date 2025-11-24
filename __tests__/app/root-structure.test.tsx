import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("next/error", () => jest.fn(({ statusCode }: { statusCode: number }) => (
  <div data-testid="next-error">status:{statusCode}</div>
)));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("next/document", () => {
  const React = require("react");
  class MockDocument extends React.Component {
    constructor(props: any, context: any) {
      super(props, context);
    }
    render() {
      return React.createElement("html", null, this.props.children);
    }
  }
  const Html = ({ children }: { children: React.ReactNode }) => <html>{children}</html>;
  const Head = ({ children }: { children: React.ReactNode }) => <head>{children}</head>;
  const Main = () => <main data-testid="next-main" />;
  const NextScript = () => <script data-testid="next-script" />;
  return { __esModule: true, default: MockDocument, Html, Head, Main, NextScript };
});

jest.mock("@sentry/nextjs", () => ({ captureException: jest.fn() }));

jest.mock("../../app/auth/provider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  )
}));

jest.mock("../../app/logrocket-client", () => () => <div data-testid="logrocket" />);

jest.mock("../../app/components/MicrosoftClarity", () => ({ clarityId }: { clarityId: string }) => (
  <div data-testid="clarity">{clarityId || "no-id"}</div>
));

jest.mock("../../app/components/Footer", () => () => <div data-testid="footer">footer</div>);
jest.mock("../../app/components/Navbar", () => () => <div data-testid="navbar">navbar</div>);
jest.mock("../../app/components/home/HeroSection", () => () => <div>hero</div>);
jest.mock("../../app/components/home/WhyPantauTularSection", () => () => <div>why</div>);
jest.mock("../../app/components/home/AdvantagesSection", () => () => <div>advantages</div>);
jest.mock("../../app/components/home/AboutSection", () => () => <div>about</div>);
jest.mock("../../app/components/home/HelpSection", () => () => <div>help</div>);
jest.mock("../../app/components/home/MapGallery", () => () => <div>map-gallery</div>);

const toArray = (node: any) => React.Children.toArray(node?.props?.children ?? []);
const findNode = (node: any, predicate: (child: any) => boolean): any | null => {
  if (!node || typeof node !== "object") return null;
  if (predicate(node)) return node;
  for (const child of toArray(node)) {
    const found = findNode(child, predicate);
    if (found) return found;
  }
  return null;
};

describe.skip("app shell smoke tests", () => {
  test("custom document renders expected script", () => {
    const Document = require("../../app/_document").default;
    const instance = new Document({}, {}) as any;
    const tree = instance.render();
    const scriptNode = findNode(
      tree,
      (child) => child?.props?.src === "/js/new-relic.js"
    );
    expect(scriptNode).not.toBeNull();
  });

  test("global error captures exception and renders NextError", () => {
    const GlobalError = require("../../app/global-error").default;
    const sentry = require("@sentry/nextjs");
    const error = new Error("boom");

    const { renderToStaticMarkup } = require("react-dom/server");
    const markup = renderToStaticMarkup(<GlobalError error={error} />);
    expect(sentry.captureException).toHaveBeenCalledWith(error);
    expect(markup).toContain('data-testid="next-error"');
  });

  test("root layout wraps children with providers and scripts", () => {
    const RootLayout = require("../../app/layout").default;
    const tree = (
      <RootLayout>
        <div data-testid="child-slot">child-content</div>
      </RootLayout>
    );

    const authProvider = findNode(tree, (child) => child?.props?.["data-testid"] === "auth-provider");
    const logrocket = findNode(tree, (child) => child?.props?.["data-testid"] === "logrocket");
    const clarity = findNode(tree, (child) => child?.props?.["data-testid"] === "clarity");
    const scriptNode = findNode(tree, (child) => child?.props?.src === "/js/new-relic.js");
    const childContent = findNode(tree, (child) => child?.props?.["data-testid"] === "child-slot");

    expect(authProvider).not.toBeNull();
    expect(logrocket).not.toBeNull();
    expect(clarity?.props?.children).toBe("no-id");
    expect(scriptNode).not.toBeNull();
    expect(childContent).not.toBeNull();
  });

  test("logrocket initializer identifies authenticated users", () => {
    jest.resetModules();
    jest.doMock("../../app/auth/hooks/useAuth", () => ({
      useAuth: () => ({ user: { id: 1, name: "Jane", email: "jane@site", role: "ADMIN" } }),
    }));
    const initSpy = jest.fn();
    const identifySpy = jest.fn();
    jest.doMock("../../utils/logrocket", () => ({ initLogRocket: initSpy }));
    jest.doMock("logrocket", () => ({ identify: identifySpy }));

    const Component = require("../../app/logrocket-client").default;
    render(<Component />);

    expect(initSpy).toHaveBeenCalled();
    expect(identifySpy).toHaveBeenCalledWith("1", expect.objectContaining({ name: "Jane" }));
  });

  test("logrocket initializer skips identify when user missing", () => {
    jest.resetModules();
    jest.doMock("../../app/auth/hooks/useAuth", () => ({ useAuth: () => ({ user: null }) }));
    const initSpy = jest.fn();
    const identifySpy = jest.fn();
    jest.doMock("../../utils/logrocket", () => ({ initLogRocket: initSpy }));
    jest.doMock("logrocket", () => ({ identify: identifySpy }));

    const Component = require("../../app/logrocket-client").default;
    render(<Component />);

    expect(initSpy).toHaveBeenCalled();
    expect(identifySpy).not.toHaveBeenCalled();
  });

  test("not-found page renders CTA", () => {
    const NotFound = require("../../app/not-found").default;
    render(<NotFound />);
    expect(screen.getByText(/Halaman Tidak Ditemukan/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kembali ke Beranda/i })).toHaveAttribute("href", "/");
  });

  test("home page composes primary sections", () => {
    const Home = require("../../app/page").default;
    render(<Home />);
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByText("hero")).toBeInTheDocument();
    expect(screen.getByText("help")).toBeInTheDocument();
  });
});
