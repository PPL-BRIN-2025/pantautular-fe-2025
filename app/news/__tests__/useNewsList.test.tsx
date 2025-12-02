import { renderHook, waitFor, act } from "@testing-library/react";
import { useNewsList, __testables } from "../hooks/useNewsList";
import type { NewsArticle, NewsListResponse } from "../domain/types";
import { NEWS_PAGE_SIZE } from "../constants";

const sampleArticles: NewsArticle[] = [
  {
    id: "1",
    title: "Sample",
    summary: "Summary",
    source_name: "PantauTular",
    source_url: "https://example.com",
    thumbnail_url: "https://example.com/img.jpg",
    published_at: "2024-01-01T00:00:00Z",
    is_curated: true,
    curated_tags: ["tag-a"],
  },
];

const createFetchResponse = (body: NewsListResponse, ok = true, status = 200): Partial<Response> => ({
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

describe("useNewsList", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn();
  });

  it("fetches with default pagination when params omitted", async () => {
    const payload: NewsListResponse = { data: sampleArticles, page: 1, pageSize: NEWS_PAGE_SIZE, total: 25 };
    (global.fetch as jest.Mock).mockResolvedValue(createFetchResponse(payload));

    const { result } = renderHook(() => useNewsList({}));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(global.fetch).toHaveBeenCalledWith(
      `/api/news?page=1&page_size=${NEWS_PAGE_SIZE}`,
      expect.any(Object)
    );
    expect(result.current.data).toEqual(payload);
    expect(result.current.isError).toBe(false);
  });

  it("composes URL query string from params", async () => {
    const payload: NewsListResponse = { data: sampleArticles, page: 2, pageSize: 20, total: 40 };
    (global.fetch as jest.Mock).mockResolvedValue(createFetchResponse(payload));

    const params = {
      page: 2,
      pageSize: 20,
      search: "flu",
      source: "who",
      tags: ["mosquito", "dengue"],
      curatedOnly: true,
      fromDate: "2024-01-01",
      toDate: "2024-02-01",
      hasImage: true,
    };
    const { result } = renderHook(() => useNewsList(params));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain("page=2");
    expect(url).toContain("page_size=20");
    expect(url).toContain("search=flu");
    expect(url).toContain("source=who");
    expect(url).toContain("tags=mosquito%2Cdengue");
    expect(url).toContain("curated_only=true");
    expect(url).toContain("from_date=2024-01-01");
    expect(url).toContain("to_date=2024-02-01");
    expect(url).toContain("has_image=true");
  });

  it("supports undefined params via default argument", async () => {
    const payload: NewsListResponse = { data: sampleArticles, page: 1, pageSize: NEWS_PAGE_SIZE, total: 25 };
    (global.fetch as jest.Mock).mockResolvedValue(createFetchResponse(payload));
    renderHook(() => useNewsList());
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  it("surfaces fetch errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createFetchResponse({ data: [], page: 1, pageSize: NEWS_PAGE_SIZE, total: 0 }, false, 500)
    );

    const { result } = renderHook(() => useNewsList({ page: 3 }));

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain("500");
  });

  it("handles non-JSON error responses when parsing detail", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockRejectedValue(new Error("no json")),
    });

    const { result } = renderHook(() => useNewsList({ page: 1 }));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain("500");
  });

  it("refetch triggers a new network call", async () => {
    const payload: NewsListResponse = { data: sampleArticles, page: 1, pageSize: NEWS_PAGE_SIZE, total: 25 };
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createFetchResponse(payload))
      .mockResolvedValueOnce(createFetchResponse(payload));

    const { result } = renderHook(() => useNewsList({ page: 1 }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.refetch();
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("includes has_image=false when requested", async () => {
    const payload: NewsListResponse = { data: sampleArticles, page: 1, pageSize: NEWS_PAGE_SIZE, total: 25 };
    (global.fetch as jest.Mock).mockResolvedValue(createFetchResponse(payload));

    renderHook(() => useNewsList({ hasImage: false }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain("has_image=false");
  });

  it("handles payload.results fallback with count/currentPage metadata", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        results: sampleArticles,
        count: 77,
        currentPage: 3,
        per_page: 5,
      }),
    });

    const { result } = renderHook(() => useNewsList({ page: 3, pageSize: 5 }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.data).toEqual(sampleArticles);
    expect(result.current.data?.total).toBe(77);
    expect(result.current.data?.page).toBe(3);
    expect(result.current.data?.pageSize).toBe(5);
  });

  it("handles payload.articles fallback with totalResults metadata", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        articles: sampleArticles,
        totalResults: 55,
        page: 4,
        pageSize: 2,
      }),
    });

    const { result } = renderHook(() => useNewsList({ page: 4, pageSize: 2 }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.data).toEqual(sampleArticles);
    expect(result.current.data?.total).toBe(55);
    expect(result.current.data?.page).toBe(4);
    expect(result.current.data?.pageSize).toBe(2);
  });

  it("falls back to empty data when payload lacks article arrays", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    const { result } = renderHook(() => useNewsList({ page: 5, pageSize: 15 }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.data).toEqual([]);
    expect(result.current.data?.total).toBe(0);
    expect(result.current.data?.page).toBe(5);
    expect(result.current.data?.pageSize).toBe(15);
  });

  it("includes API error detail strings when available", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 502,
      json: jest.fn().mockResolvedValue({ detail: "Gateway timeout" }),
    });

    const { result } = renderHook(() => useNewsList({ page: 1 }));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain("Gateway timeout");
  });

  it("swallows AbortError without setting error state", async () => {
    (global.fetch as jest.Mock).mockRejectedValue({ name: "AbortError" });
    const { result } = renderHook(() => useNewsList({}));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull();
  });

  it("ignores updates once unmounted on success", async () => {
    const deferred = createDeferred<Response>();
    (global.fetch as jest.Mock).mockReturnValue(deferred.promise);
    const { unmount, result } = renderHook(() => useNewsList({ page: 1 }));

    await act(async () => {
      unmount();
    });

    await act(async () => {
      deferred.resolve({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: sampleArticles,
          total: 10,
          page: 1,
          pageSize: NEWS_PAGE_SIZE,
        }),
      } as unknown as Response);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it("ignores updates once unmounted on failure", async () => {
    const deferred = createDeferred<Response>();
    (global.fetch as jest.Mock).mockReturnValue(deferred.promise);
    const { unmount, result } = renderHook(() => useNewsList({ page: 1 }));

    await act(async () => {
      unmount();
    });

    await act(async () => {
      deferred.reject(new Error("Network down"));
    });

    expect(result.current.error).toBeNull();
  });

  it("wraps non-error rejections into Error instances", async () => {
    (global.fetch as jest.Mock).mockRejectedValue("explode");
    const { result } = renderHook(() => useNewsList({ page: 1 }));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe("useNewsList __testables", () => {
  const { normalizeParams, extractArticles, extractTotal, extractPage, extractPageSize, readErrorDetail, toQueryString } =
    __testables;

  it("normalizes params by trimming values and filtering tags", () => {
    const normalized = normalizeParams({
      page: 0,
      pageSize: -5,
      search: " dengue ",
      source: " who ",
      tags: [" fever ", " "],
      hasImage: undefined,
    });

    expect(normalized.page).toBe(1);
    expect(normalized.pageSize).toBe(NEWS_PAGE_SIZE);
    expect(normalized.search).toBe("dengue");
    expect(normalized.source).toBe("who");
    expect(normalized.tags).toEqual(["fever"]);
    expect(normalized.hasImage).toBeUndefined();
  });

  it("normalizes empty or blank tag arrays to undefined", () => {
    expect(normalizeParams({ tags: [] }).tags).toBeUndefined();
    expect(normalizeParams({ tags: ["   "] }).tags).toBeUndefined();
  });

  it("falls back to defaults when params omitted", () => {
    expect(normalizeParams()).toMatchObject({ page: 1, pageSize: NEWS_PAGE_SIZE });
  });

  it("extracts articles from data/results/articles structures", () => {
    expect(extractArticles({ data: sampleArticles })).toEqual(sampleArticles);
    expect(extractArticles({ results: sampleArticles })).toEqual(sampleArticles);
    expect(extractArticles({ articles: sampleArticles })).toEqual(sampleArticles);
    expect(extractArticles({})).toEqual([]);
  });

  it("extracts totals from multiple fields", () => {
    expect(extractTotal({ total: 10 }, 0)).toBe(10);
    expect(extractTotal({ count: 11 }, 0)).toBe(11);
    expect(extractTotal({ totalResults: 12 }, 0)).toBe(12);
    expect(extractTotal({}, 5)).toBe(5);
  });

  it("extracts page metadata from multiple fields", () => {
    expect(extractPage({ page: 7 }, 1)).toBe(7);
    expect(extractPage({ currentPage: 8 }, 1)).toBe(8);
    expect(extractPage({}, 2)).toBe(2);
  });

  it("extracts pageSize metadata from multiple fields", () => {
    expect(extractPageSize({ pageSize: 50 }, NEWS_PAGE_SIZE)).toBe(50);
    expect(extractPageSize({ per_page: 25 }, NEWS_PAGE_SIZE)).toBe(25);
    expect(extractPageSize({}, 5)).toBe(5);
  });

  it("serializes query params with optional fields", () => {
    const query = toQueryString({
      page: 2,
      pageSize: 5,
      search: "flu",
      source: "who",
      tags: ["a"],
      curatedOnly: true,
      fromDate: "2024-01-01",
      toDate: "2024-01-02",
      hasImage: false,
    });
    expect(query).toContain("search=flu");
    expect(query).toContain("has_image=false");
  });

  it("reads error details via readErrorDetail helper", async () => {
    await expect(
      readErrorDetail({ json: async () => ({ detail: "Bad" }) } as unknown as Response)
    ).resolves.toBe("Bad");
    await expect(
      readErrorDetail({ json: async () => ({ message: "Boom" }) } as unknown as Response)
    ).resolves.toBe("Boom");
    await expect(
      readErrorDetail({ json: async () => { throw new Error("oops"); } } as unknown as Response)
    ).resolves.toBe("");
  });
});
