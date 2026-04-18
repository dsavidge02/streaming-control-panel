import { vi } from "vitest";

export async function withFetchRecorder<T>(
	fn: () => Promise<T> | T,
): Promise<{ result: T; calls: Request[] }> {
	const calls: Request[] = [];
	const originalFetch = globalThis.fetch;

	globalThis.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
		calls.push(new Request(input, init));
		return new Promise<Response>(() => {});
	}) as typeof fetch;

	try {
		const result = await fn();
		return { result, calls };
	} finally {
		globalThis.fetch = originalFetch;
	}
}
