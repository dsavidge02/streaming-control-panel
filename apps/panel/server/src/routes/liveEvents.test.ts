import { heartbeatEventSchema, PATHS } from "@panel/shared";
import { describe, expect, it, vi } from "vitest";
import { buildServer } from "../server/buildServer.js";

describe("registerLiveEventsRoute", () => {
	it("TC-6.3b unauthenticated subscribe returns 401", async () => {
		const { app } = await buildServer({ inMemoryDb: true });
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

	// Story 4: un-skip once sealFixtureSession helper lands.
	it.skip("TC-6.3a heartbeat cadence: at least one heartbeat within 30s simulated time", async () => {
		vi.useFakeTimers();

		try {
			const { sealFixtureSession } = await import(
				"../test/sealFixtureSession.js"
			);
			const sealedSession = await sealFixtureSession();
			const { app } = await buildServer({ inMemoryDb: true });
			await app.ready();

			try {
				const responsePromise = app.inject({
					method: "GET",
					url: PATHS.live.events,
					headers: {
						cookie: `panel_session=${sealedSession}`,
					},
				});

				await vi.advanceTimersByTimeAsync(30_000);

				const response = await responsePromise;
				expect(response.body).toContain("event: heartbeat");
			} finally {
				await app.close();
			}
		} finally {
			vi.useRealTimers();
		}
	});

	// Story 4: un-skip once sealFixtureSession helper lands.
	it.skip("TC-6.4a heartbeat event payload parses against the shared SSE schema", async () => {
		const { sealFixtureSession } = await import(
			"../test/sealFixtureSession.js"
		);
		const sealedSession = await sealFixtureSession();
		const { app } = await buildServer({ inMemoryDb: true });
		await app.ready();

		try {
			const response = await app.inject({
				method: "GET",
				url: PATHS.live.events,
				headers: {
					cookie: `panel_session=${sealedSession}`,
				},
			});
			const firstDataLine = response.body
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
			await app.close();
		}
	});

	it("TC-2.2a unauthenticated /live/events returns 401 AUTH_REQUIRED envelope", async () => {
		const { app } = await buildServer({ inMemoryDb: true });
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
		const { app } = await buildServer({ inMemoryDb: true });
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
		const { app } = await buildServer({ inMemoryDb: true });
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
