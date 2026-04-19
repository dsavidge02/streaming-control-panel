// `app.inject()` buffers SSE bodies until the socket closes, so cadence tests
// use a real listener + fetch stream instead of Fastify injection.
import { heartbeatEventSchema, PATHS } from "@panel/shared";
import { describe, expect, it, vi } from "vitest";
import { HEARTBEAT_INTERVAL_MS } from "./liveEvents.js";
import { buildTestServer } from "../test/buildTestServer.js";

interface LiveEventsStream {
	app: Awaited<ReturnType<typeof buildTestServer>>["app"];
	events: string[];
	response: Response;
	waitForCount: (count: number) => Promise<void>;
	close: () => Promise<void>;
}

async function openLiveEventsStream(): Promise<LiveEventsStream> {
	const { sealFixtureSession } = await import("../test/sealFixtureSession.js");
	const sealedSession = await sealFixtureSession();
	const { app } = await buildTestServer();
	await app.ready();

	const baseUrl = await app.listen({ host: "127.0.0.1", port: 0 });
	const controller = new AbortController();
	const response = await fetch(`${baseUrl}${PATHS.live.events}`, {
		headers: {
			cookie: `panel_session=${sealedSession}`,
		},
		signal: controller.signal,
	});
	const reader = response.body?.getReader();
	if (!reader) {
		await app.close();
		throw new Error("Expected a readable SSE response body");
	}

	const decoder = new TextDecoder();
	const events: string[] = [];
	const waiters = new Map<number, () => void>();
	let buffer = "";

	const resolveWaiters = () => {
		for (const [count, resolve] of waiters) {
			if (events.length >= count) {
				waiters.delete(count);
				resolve();
			}
		}
	};

	// Splits the SSE stream on blank-line boundaries and resolves any waiters
	// gated on event count.
	const pump = (async () => {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });

			let boundary = buffer.indexOf("\n\n");
			while (boundary !== -1) {
				const chunk = buffer.slice(0, boundary).trim();
				buffer = buffer.slice(boundary + 2);
				if (chunk) {
					events.push(chunk);
					resolveWaiters();
				}
				boundary = buffer.indexOf("\n\n");
			}
		}
	})();

	return {
		app,
		events,
		response,
		waitForCount: (count) =>
			events.length >= count
				? Promise.resolve()
				: new Promise((resolve) => {
						waiters.set(count, resolve);
					}),
		close: async () => {
			controller.abort();
			try {
				await pump;
			} catch (error) {
				if (!(error instanceof DOMException && error.name === "AbortError")) {
					throw error;
				}
			}
			await app.close();
		},
	};
}

describe("registerLiveEventsRoute", () => {
	it("TC-6.3b unauthenticated subscribe returns 401", async () => {
		const { app } = await buildTestServer();
		await app.ready();

		try {
			const response = await app.inject({
				method: "GET",
				url: PATHS.live.events,
			});
			const payload = response.json();

			expect(response.statusCode).toBe(401);
			expect(payload).toMatchObject({
				error: { code: "AUTH_REQUIRED" },
			});
			expect(payload.error.message.length).toBeGreaterThan(0);
		} finally {
			await app.close();
		}
	});

	it("TC-6.3a heartbeat emits on connect and every 15s thereafter", async () => {
		vi.useFakeTimers();
		const intervalSpy = vi.spyOn(globalThis, "setInterval");

		try {
			const stream = await openLiveEventsStream();

			try {
				expect(stream.response.status).toBe(200);
				expect(intervalSpy).toHaveBeenCalledWith(
					expect.any(Function),
					HEARTBEAT_INTERVAL_MS,
				);

				await stream.waitForCount(1);

				await vi.advanceTimersByTimeAsync(16_000);
				await stream.waitForCount(2);
				expect(stream.events).toHaveLength(2);

				await vi.advanceTimersByTimeAsync(15_000);
				await stream.waitForCount(3);
				expect(stream.events).toHaveLength(3);
			} finally {
				await stream.close();
			}
		} finally {
			intervalSpy.mockRestore();
			vi.useRealTimers();
		}
	});

	it("TC-6.4a heartbeat event payload parses against the shared SSE schema", async () => {
		const stream = await openLiveEventsStream();

		try {
			expect(stream.response.status).toBe(200);
			await stream.waitForCount(1);

			const firstEvent = stream.events[0];
			expect(firstEvent).toBeDefined();
			if (!firstEvent) {
				throw new Error("Expected at least one SSE event");
			}

			const firstDataLine = firstEvent
				.split("\n")
				.find((line) => line.startsWith("data: "));

			expect(firstDataLine).toBeDefined();
			if (!firstDataLine) {
				throw new Error("Expected at least one SSE data line");
			}
			const parsed = heartbeatEventSchema.parse(
				JSON.parse(firstDataLine.slice("data: ".length)),
			);

			expect(parsed.type).toBe("heartbeat");
			expect(parsed.data).toEqual({});
		} finally {
			await stream.close();
		}
	});

	it("TC-2.2a unauthenticated /live/events returns 401 AUTH_REQUIRED envelope", async () => {
		const { app } = await buildTestServer();
		await app.ready();

		try {
			const response = await app.inject({
				method: "GET",
				url: PATHS.live.events,
			});
			const payload = response.json();

			expect(response.statusCode).toBe(401);
			expect(payload).toMatchObject({
				error: { code: "AUTH_REQUIRED" },
			});
			expect(payload.error.message.length).toBeGreaterThan(0);
		} finally {
			await app.close();
		}
	});

	it("TC-3.4b server-only mode: /live/events gated unauth -> 401", async () => {
		const { app } = await buildTestServer();
		await app.ready();

		try {
			const response = await app.inject({
				method: "GET",
				url: PATHS.live.events,
			});
			const payload = response.json();

			expect(response.statusCode).toBe(401);
			expect(payload).toMatchObject({
				error: { code: "AUTH_REQUIRED" },
			});
			expect(payload.error.message.length).toBeGreaterThan(0);
		} finally {
			await app.close();
		}
	});

	it("TC-8.1a 401 envelope shape", async () => {
		const { app } = await buildTestServer();
		await app.ready();

		try {
			const response = await app.inject({
				method: "GET",
				url: PATHS.live.events,
			});
			const payload = response.json();

			expect(response.statusCode).toBe(401);
			expect(payload).toEqual({
				error: {
					code: "AUTH_REQUIRED",
					message: expect.any(String),
				},
			});
			expect(payload.error.message.length).toBeGreaterThan(0);
		} finally {
			await app.close();
		}
	});
});
