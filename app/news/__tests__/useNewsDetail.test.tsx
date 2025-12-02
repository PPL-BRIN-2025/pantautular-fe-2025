import { act, renderHook, waitFor } from "@testing-library/react";
import { useNewsDetail } from "../hooks/useNewsDetail";
import type { NewsArticle } from "../domain/types";

const article: NewsArticle = {
  id: "alpha",
  title: "Alpha title",
  summary: "Detail summary",
  source_name: "PantauTular",
  source_url: "https://example.com",
  thumbnail_url: "https://example.com/img.jpg",
  published_at: "2024-01-02T10:00:00Z",
  is_curated: false,
  curated_tags: [],
};

const mockResponse = (body: NewsArticle, ok = true, status = 200): Partial<Response> => ({
  ok,
  status,
  json: jest.fn().mockResolvedValue(body),
  text: jest.fn().mockResolvedValue(JSON.stringify(body)),
});

const createDeferred = <T,>() => {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return { promise, resolve: resolve!, reject: reject! };
};

describe("useNewsDetail", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn();
  });

  it("fetches an article by id", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse(article));

    const { result } = renderHook(() => useNewsDetail("alpha"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(global.fetch).toHaveBeenCalledWith("/api/news/alpha", expect.any(Object));
    expect(result.current.data).toEqual(article);
  });

  it("handles HTTP errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse(article, false, 404));

    const { result } = renderHook(() => useNewsDetail("missing"));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("skips fetching when id is missing", async () => {
    const { result } = renderHook(() => useNewsDetail(undefined as unknown as string));
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("handles non-JSON error payloads when detail parsing fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockRejectedValue(new Error("boom")),
    });

    const { result } = renderHook(() => useNewsDetail("missing"));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain("500");
  });

  it("includes API detail string in error message", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: jest.fn().mockResolvedValue({ detail: "Nope" }),
    });

    const { result } = renderHook(() => useNewsDetail("404"));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain("Nope");
  });

  it("includes API message string in error message", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({ message: "Bad payload" }),
    });

    const { result } = renderHook(() => useNewsDetail("400"));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain("Bad payload");
  });

  it("converts numeric ids to string", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse(article));
    renderHook(() => useNewsDetail(42));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith("/api/news/42", expect.any(Object));
  });

  it("ignores updates once unmounted on success", async () => {
    const deferred = createDeferred<Response>();
    (global.fetch as jest.Mock).mockReturnValue(deferred.promise);

    const { unmount, result } = renderHook(() => useNewsDetail("alpha"));

    await act(async () => {
      unmount();
    });

    await act(async () => {
      deferred.resolve({
        ok: true,
        json: jest.fn().mockResolvedValue(article),
      } as unknown as Response);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it("ignores updates once unmounted on failure", async () => {
    const deferred = createDeferred<Response>();
    (global.fetch as jest.Mock).mockReturnValue(deferred.promise);

    const { unmount, result } = renderHook(() => useNewsDetail("alpha"));
    await act(async () => {
      unmount();
    });

    await act(async () => {
      deferred.reject(new Error("fail"));
    });

    expect(result.current.error).toBeNull();
  });

  it("swallows AbortError rejections", async () => {
    (global.fetch as jest.Mock).mockRejectedValue({ name: "AbortError" });
    const { result } = renderHook(() => useNewsDetail("alpha"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull();
  });

  it("wraps non-error rejections", async () => {
    (global.fetch as jest.Mock).mockRejectedValue("boom");
    const { result } = renderHook(() => useNewsDetail("alpha"));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
