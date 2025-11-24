function buildMockResponse(opts: {
  ok: boolean;
  status: number;
  body: any;
}): Response {
  const payload = {
    ok: opts.ok,
    status: opts.status,
    json: async () => {
      if (typeof opts.body === "string") {
        try {
          return JSON.parse(opts.body);
        } catch {
          return { detail: opts.body };
        }
      }
      return opts.body ?? {};
    },
    text: async () =>
      typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body ?? {}),
  } as unknown as Response & { clone: () => Response };

  payload.clone = () =>
    buildMockResponse({
      ok: opts.ok,
      status: opts.status,
      body: opts.body,
    });

  return payload;
}

export function okJson(body: any): Promise<Response> {
  return Promise.resolve(
    buildMockResponse({ ok: true, status: 200, body })
  );
}

export function resp(status: number, body?: any): Promise<Response> {
  return Promise.resolve(
    buildMockResponse({ ok: status >= 200 && status < 300, status, body })
  );
}

describe("http response helpers", () => {
  it("okJson resolves with accessible json() and clone()", async () => {
    const response = await okJson({ foo: "bar" });
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ foo: "bar" });
    await expect(response.clone().json()).resolves.toEqual({ foo: "bar" });
  });

  it("resp exposes status and text", async () => {
    const response = await resp(500, "Boom");
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
    await expect(response.text()).resolves.toBe("Boom");
  });
});
