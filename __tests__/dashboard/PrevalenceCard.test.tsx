import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PrevalenceCard from "../../app/components/dashboard/PrevalenceCard";

const mockDownloadButton = jest.fn(() => <div data-testid="mock-download" />);

jest.mock("../../app/components/dashboard/DownloadButton", () => (props: any) => {
  mockDownloadButton(props);
  return <div data-testid="mock-download" />;
});

describe("PrevalenceCard", () => {
  const defaultProps = {
    prevalenceRate: 0.07315,
    populationYear: 2024,
    populationCount: 279390258,
  };

  beforeEach(() => {
    mockDownloadButton.mockClear();
  });

  test("renders prevalence value with percent sign and enables download", () => {
    render(<PrevalenceCard {...defaultProps} />);

    expect(screen.getByText("Estimasi Prevalensi")).toBeInTheDocument();
    expect(screen.getByText(/0.07315/)).toBeInTheDocument();
    expect(screen.getByText("%")).toBeInTheDocument();

    const downloadProps = mockDownloadButton.mock.calls[0][0];
    expect(typeof downloadProps.getTarget).toBe("function");
    expect(downloadProps.filename).toBe("estimasi-prevalensi");
    expect(downloadProps.canDownload()).toBe(true);
  });

  test("disables download when both prevalence and population missing numeric values", () => {
    render(
      <PrevalenceCard
        prevalenceRate="N/A"
        populationYear={2023}
        populationCount="unknown"
      />
    );

    const downloadProps = mockDownloadButton.mock.calls[0][0];
    expect(downloadProps.canDownload()).toBe(false);
    expect(screen.queryByText("%")).not.toBeInTheDocument();
    expect(
      screen.getByText((text) => text.includes("pada tahun 2023 (unknown"))
    ).toBeInTheDocument();
  });

  test("exposes rendered container to download button target getter", () => {
    render(<PrevalenceCard {...defaultProps} />);
    const downloadProps = mockDownloadButton.mock.calls[0][0];

    const target = downloadProps.getTarget();
    expect(target).toBeInstanceOf(HTMLDivElement);
    expect(target).toHaveTextContent("Estimasi Prevalensi");
  });
});
