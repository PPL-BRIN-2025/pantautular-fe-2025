const rawApiBase = process.env.NEXT_PUBLIC_API_URL;

export const API_BASE_RAW = rawApiBase;

export const API_BASE = rawApiBase && rawApiBase.trim() !== ""
	? rawApiBase
	: "http://localhost:8000";
