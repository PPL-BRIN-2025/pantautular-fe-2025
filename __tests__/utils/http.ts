export function okJson(body: any): Promise<Response> {
  const response = {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    clone() {
      return this as unknown as Response;
    },
  } as unknown as Response;
  return Promise.resolve(response);
}

export function resp(status: number, body?: any): Promise<Response> {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (typeof body === "string") {
        try { return JSON.parse(body); } catch { return { detail: body }; }
      }
      return body ?? {};
    },
    text: async () => (typeof body === "string" ? body : JSON.stringify(body ?? {})),
    clone() {
      return this as unknown as Response;
    },
  } as unknown as Response;
  return Promise.resolve(response);
}

// Smoke tests to satisfy Jest runner
describe("http test helpers", () => {
  it("okJson returns ok response", async () => {
    const res = await okJson({ foo: "bar" });
    expect(res.ok).toBe(true);
    expect(await res.json()).toEqual({ foo: "bar" });
  });

  it("resp returns typed response", async () => {
    const res = await resp(500, { detail: "err" });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ detail: "err" });
  });
});
