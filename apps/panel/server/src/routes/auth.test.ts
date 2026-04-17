import { errorEnvelopeSchema, PATHS } from "@panel/shared";
import { describe, expect, it } from "vitest";
import { buildServer } from "../server/buildServer.js";

describe("registerAuthRoutes", () => {
	// Story 4: un-skip once real Origin preHandler lands.
	it.skip("TC-6.2a POST /auth/login returns 501 NOT_IMPLEMENTED with matching Origin", async () => {
		const { app } = await buildServer({ inMemoryDb: true });
		await app.ready();

		try {
			const response = await app.inject({
				method: "POST",
				url: PATHS.auth.login,
				headers: { Origin: "app://panel" },
			});
			const payload = response.json();

			expect(response.statusCode).toBe(501);
			expect(payload).toMatchObject({
				error: { code: "NOT_IMPLEMENTED" },
			});
			expect(payload.error.message.length).toBeGreaterThan(0);
		} finally {
			await app.close();
		}
	});

	// Story 4: un-skip once real Origin preHandler lands.
	it.skip("TC-6.2b POST /auth/login returns 403 ORIGIN_REJECTED with mismatched Origin", async () => {
		const { app } = await buildServer({ inMemoryDb: true });
		await app.ready();

		try {
			const response = await app.inject({
				method: "POST",
				url: PATHS.auth.login,
				headers: { Origin: "http://evil.com" },
			});

			expect(response.statusCode).toBe(403);
			expect(response.json()).toMatchObject({
				error: { code: "ORIGIN_REJECTED" },
			});
		} finally {
			await app.close();
		}
	});

	// Story 4: un-skip once real Origin preHandler lands.
	it.skip("TC-2.3c POST /auth/login reaches handler unauthenticated (exempt)", async () => {
		const { app } = await buildServer({ inMemoryDb: true });
		await app.ready();

		try {
			const response = await app.inject({
				method: "POST",
				url: PATHS.auth.login,
				headers: { Origin: "app://panel" },
			});

			expect(response.statusCode).toBe(501);
			expect(response.json()).toMatchObject({
				error: { code: "NOT_IMPLEMENTED" },
			});
		} finally {
			await app.close();
		}
	});

	// Story 4: un-skip once real Origin preHandler lands.
	it.skip("TC-8.1c POST /auth/login returns the NOT_IMPLEMENTED error envelope", async () => {
		const { app } = await buildServer({ inMemoryDb: true });
		await app.ready();

		try {
			const response = await app.inject({
				method: "POST",
				url: PATHS.auth.login,
				headers: { Origin: "app://panel" },
			});
			const payload = response.json();

			expect(response.statusCode).toBe(501);
			expect(errorEnvelopeSchema.safeParse(payload).success).toBe(true);
			expect(payload).toMatchObject({
				error: { code: "NOT_IMPLEMENTED" },
			});
			expect(payload.error.message.length).toBeGreaterThan(0);
		} finally {
			await app.close();
		}
	});
});
