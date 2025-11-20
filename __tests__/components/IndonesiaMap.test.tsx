import React from "react";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { IndonesiaMap } from "../../app/components/IndonesiaMap";

const mockZoomToLocation = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => "/",
}));
jest.mock("../../hooks/useIndonesiaMap", () => ({
  useIndonesiaMap: () => ({
    mapService: { zoomToLocation: mockZoomToLocation },
  }),
}));
jest.mock("../../app/components/floating_buttons/DashboardButton", () => () => <div data-testid="dashboard-btn" />);
jest.mock("../../app/components/floating_buttons/WarningButton", () => () => <div data-testid="warning-btn" />);
jest.mock("../../app/components/floating_buttons/LocationButton", () => (props: any) => (
  <button data-testid="location-btn" onClick={props.onClick} />
));
jest.mock("../../app/components/floating_buttons/MapButton", () => ({
  __esModule: true,
  MapButton: () => <div data-testid="map-btn" />,
  default: () => <div data-testid="map-btn" />,
}));
jest.mock("../../auth/hooks/useAuth", () => ({
  __esModule: true,
  useAuth: () => ({ user: null }),
}), { virtual: true });
jest.mock("../../app/auth/hooks/useAuth", () => ({
  __esModule: true,
  useAuth: () => ({ user: null }),
}));

jest.mock("../../hooks/useUserLocation", () => ({
  useUserLocation: (_setShow: any, _setError: any, onSuccess: any, onDenied: any) => ({
    handleAllow: () => onSuccess(1, 2),
    handleDeny: () => onDenied && onDenied(),
  }),
}));

jest.mock("../../store/store", () => ({
  useMapStore: (selector: any) => selector({ countSelectedPoints: 3 }),
}));

const permissionProps: any[] = [];
const errorProps: any[] = [];
jest.mock("../../app/components/LocationPermissionPopup", () => (props: any) => {
  permissionProps.push(props);
  return <div data-testid="permission-popup" data-open={props.open} />;
});

jest.mock("../../app/components/LocationErrorPopup", () => (props: any) => {
  errorProps.push(props);
  return <div data-testid="error-popup" data-open={props.open} />;
});

describe("IndonesiaMap", () => {
  beforeEach(() => {
    permissionProps.length = 0;
    errorProps.length = 0;
    mockZoomToLocation.mockClear();
  });

  const baseProps = {
    locations: [],
    provinceHumidityData: [],
    provinceTemperatureData: [],
    provincePrecipitationData: [],
    provinceSeverityData: [],
    onError: jest.fn(),
  };

  test("renders map container and fires location success", () => {
    render(<IndonesiaMap {...baseProps} />);
    // trigger allow flow from permission popup to invoke zoomToLocation
    act(() => {
      permissionProps[0]?.onAllow?.();
    });
    const container = screen.getByTestId("map-container");
    expect(container).toHaveStyle("width: 100vw");
    expect(mockZoomToLocation).toHaveBeenCalledWith(1, 2);
  });

  test("renders error popup when permission denied and closes it", async () => {
    render(<IndonesiaMap {...baseProps} />);
    await act(async () => {
      permissionProps[0]?.onDeny?.();
    });
    await screen.findByTestId("error-popup");
    expect(screen.getByTestId("error-popup")).toHaveAttribute("data-open", "true");

    await act(async () => {
      errorProps[0]?.onOpenChange?.();
    });
    await waitFor(() =>
      expect(screen.queryByTestId("error-popup")).not.toBeInTheDocument()
    );
  });

  test("opens permission popup when location button clicked", async () => {
    render(<IndonesiaMap {...baseProps} />);
    const locationBtn = screen.getByTestId("location-btn");
    await act(async () => {
      fireEvent.click(locationBtn);
    });
    const latestProps = permissionProps[permissionProps.length - 1];
    expect(latestProps?.open).toBe(true);
    await act(async () => {
      latestProps?.onClose?.();
    });
    await waitFor(() => {
      const closedProps = permissionProps[permissionProps.length - 1];
      expect(closedProps?.open).toBe(false);
    });
  });
});
