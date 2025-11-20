export type ContributorEventPayload = Record<string, unknown>;

export async function createContributorEvent(body: ContributorEventPayload) {
  if (process.env.NODE_ENV !== 'test') {
    try {
      console.warn('[contributorEvents] Backend belum tersedia. Mengembalikan respons mock.', body);
    } catch (_) {
      // ignore console issues
    }
  }
  return Promise.resolve({ id: Date.now(), ...body });
}
