import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AccessDeniedNotice from "../../app/expert-dashboard/_components/AccessDenied";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

test("AccessDeniedNotice renders CTA links", () => {
  render(<AccessDeniedNotice />);

  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.getByText(/Akses Ditolak/i)).toBeInTheDocument();

  const loginLink = screen.getByRole("link", { name: /Login/i });
  expect(loginLink).toHaveAttribute("href", "/login?next=/expert-dashboard");
  expect(screen.getByRole("link", { name: "Kembali" })).toHaveAttribute(
    "href",
    "/"
  );
});
