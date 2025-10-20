export function okJson(body: any): Promise<Response> {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response);
}

export function resp(status: number, body?: any): Promise<Response> {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (typeof body === "string") {
        try { return JSON.parse(body); } catch { return { detail: body }; }
      }
      return body ?? {};
    },
    text: async () => (typeof body === "string" ? body : JSON.stringify(body ?? {})),
  } as unknown as Response);
}
