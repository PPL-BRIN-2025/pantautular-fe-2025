import React from "react";
import { render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CaseDetailTooltip from "../../app/components/case_detail/MapTooltip";
import { CaseDetailData, CaseDetailProps, HealthProtocol, News } from "../../app/components/case_detail/types";

// Mock child components to simplify testing
jest.mock("../../app/components/case_detail/CaseDetailHeader", () => ({ onClose }: { onClose?: () => void }) => (
  <div data-testid="case-detail-header">
    <button onClick={onClose} data-testid="close-button">
      Close
    </button>
  </div>
));

jest.mock("../../app/components/case_detail/CaseInfo", () => ({ data }: { data: CaseDetailData }) => (
  <div data-testid="case-info">
    <div>{data.id}</div>
    <div>{data.location}</div>
    <div>{data.gender}, {data.age}</div>
    <div>{data.news[0]?.content || "No summary"}</div>
  </div>
));

jest.mock("../../app/components/case_detail/AlertLevel", () => ({ level }: { level: number }) => (
  <div data-testid="alert-level">
    Alert Level: {level}
  </div>
));

jest.mock("../../app/components/case_detail/RelatedSearch", () => ({ searchUrl }: { searchUrl: string }) => (
  <div data-testid="related-search">
    <a href={searchUrl}>Related Search</a>
  </div>
));

jest.mock("../../app/components/case_detail/NewsSection", () => ({ news }: { news: News[] }) => (
  <div data-testid="news-section">
    {news.length > 0 && (
      <>
        <div>{news[0].title}</div>
        <a href={news[0].url}>Read More</a>
      </>
    )}
  </div>
));

jest.mock("../../app/components/case_detail/HealthProtocols", () => ({ protocols }: { protocols: HealthProtocol[] }) => (
  <div data-testid="health-protocols">
    {protocols.length > 0 && (
      <a href={protocols[0].url}>{protocols[0].title}</a>
    )}
  </div>
));

describe("CaseDetailTooltip", () => {
  const mockData: CaseDetailData = {
    id: "case-123",
    location: "Jakarta",
    gender: "Male",
    age: 30,
    level_of_alertness: 3,
    related_search: "https://example.com/search?q=covid+jakarta",
    news: [
      {
        img_url: "https://example.com/news.jpg",
        url: "https://example.com/news",
        date: "2023-01-01",
        title: "Sample News Title",
        domain: "example.com",
        content: "Sample news content about the case"
      }
    ],
    health_protocols: [
      {
        title: "Wear Mask",
        url: "https://example.com/mask-protocol"
      }
    ]
  };

  const mockOnClose = jest.fn();

  const renderComponent = (props: Partial<CaseDetailProps> = {}) => {
    const defaultProps: CaseDetailProps = {
      data: mockData,
      onClose: mockOnClose,
    };
    return render(<CaseDetailTooltip {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all child components with correct props", () => {
    renderComponent();
    
    // Verify all child components are rendered
    expect(screen.getByTestId("case-detail-header")).toBeInTheDocument();
    expect(screen.getByTestId("case-info")).toBeInTheDocument();
    expect(screen.getByTestId("alert-level")).toBeInTheDocument();
    expect(screen.getByTestId("related-search")).toBeInTheDocument();
    expect(screen.getByTestId("news-section")).toBeInTheDocument();
    expect(screen.getByTestId("health-protocols")).toBeInTheDocument();
  });

  it("passes correct data to child components", () => {
    renderComponent();
    
    // CaseInfo
    expect(screen.getByText(mockData.id)).toBeInTheDocument();
    expect(screen.getByText(mockData.location)).toBeInTheDocument();
    expect(screen.getByText(`${mockData.gender}, ${mockData.age}`)).toBeInTheDocument();
    expect(screen.getByText(mockData.news[0].content)).toBeInTheDocument();
    
    // AlertLevel
    expect(screen.getByText(`Alert Level: ${mockData.level_of_alertness}`)).toBeInTheDocument();
    
    // RelatedSearch
    const searchLink = screen.getByRole('link', { name: /Related Search/i });
    expect(searchLink).toHaveAttribute('href', mockData.related_search);
    
    // NewsSection
    expect(screen.getByText(mockData.news[0].title)).toBeInTheDocument();
    const newsLink = screen.getByRole('link', { name: /Read More/i });
    expect(newsLink).toHaveAttribute('href', mockData.news[0].url);
    
    // HealthProtocols
    const protocolLink = screen.getByRole('link', { name: mockData.health_protocols[0].title });
    expect(protocolLink).toHaveAttribute('href', mockData.health_protocols[0].url);
  });

  it("handles onClose callback", async () => {
    renderComponent();
    const closeButton = screen.getByTestId("close-button");
    await userEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("handles empty news array", () => {
    renderComponent({
      data: { ...mockData, news: [] },
    });
    expect(screen.getByText("No summary")).toBeInTheDocument();
    expect(screen.queryByText(/Read More/i)).not.toBeInTheDocument();
  });

  it("handles empty health protocols", () => {
    renderComponent({
      data: { ...mockData, health_protocols: [] },
    });
    expect(screen.queryByText(/Wear Mask/i)).not.toBeInTheDocument();
  });

  it("renders without onClose callback", () => {
    renderComponent({ onClose: undefined });
    const closeButton = screen.getByTestId("close-button");
    expect(() => userEvent.click(closeButton)).not.toThrow();
  });

});