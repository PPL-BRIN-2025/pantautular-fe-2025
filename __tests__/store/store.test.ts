import { useMapStore } from "../../store/store";
import { act, renderHook } from "@testing-library/react";

describe("useMapStore", () => {
  beforeEach(() => {
    // Reset the store state before each test
    const { result } = renderHook(() => useMapStore());
    act(() => {
      result.current.setCountSelectedPoints(0);
    });
  });

  test("should initialize with countSelectedPoints set to 0", () => {
    const { result } = renderHook(() => useMapStore());
    expect(result.current.countSelectedPoints).toBe(0);
  });

  test("should update countSelectedPoints when setCountSelectedPoints is called", () => {
    const { result } = renderHook(() => useMapStore());
    
    act(() => {
      result.current.setCountSelectedPoints(5);
    });
    
    expect(result.current.countSelectedPoints).toBe(5);
  });

  test("should handle multiple updates to countSelectedPoints", () => {
    const { result } = renderHook(() => useMapStore());
    
    act(() => {
      result.current.setCountSelectedPoints(5);
    });
    
    expect(result.current.countSelectedPoints).toBe(5);
    
    act(() => {
      result.current.setCountSelectedPoints(10);
    });
    
    expect(result.current.countSelectedPoints).toBe(10);
    
    act(() => {
      result.current.setCountSelectedPoints(0);
    });
    
    expect(result.current.countSelectedPoints).toBe(0);
  });

  test("should handle negative values for countSelectedPoints", () => {
    const { result } = renderHook(() => useMapStore());
    
    act(() => {
      result.current.setCountSelectedPoints(-5);
    });
    
    expect(result.current.countSelectedPoints).toBe(-5);
  });

  test("should handle large values for countSelectedPoints", () => {
    const { result } = renderHook(() => useMapStore());
    
    act(() => {
      result.current.setCountSelectedPoints(1000000);
    });
    
    expect(result.current.countSelectedPoints).toBe(1000000);
  });

  test("store should maintain state across hook instances", () => {
    // First hook instance sets the value
    const { result: firstHookResult } = renderHook(() => useMapStore());
    
    act(() => {
      firstHookResult.current.setCountSelectedPoints(42);
    });
    
    // Second hook instance should have the same value
    const { result: secondHookResult } = renderHook(() => useMapStore());
    expect(secondHookResult.current.countSelectedPoints).toBe(42);
  });
}); 