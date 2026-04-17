import { errorEnvelopeSchema } from "@panel/shared";
import { describe, expect, it } from "vitest";
import { buildServer } from "../server/buildServer.js";

describe("registerOauthCallbackRoute", () => {
	it("TC-6.1a GET /oauth/callback returns 501", async () => {
		const { app } = await buildServer({ inMemoryDb: true });
		await app.ready();

		try {
			const response = await app.inject({
				method: "GET",
				url: "/oauth/callback",
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

	// Story 4: un-skip once real session preHandler lands.
	it.skip("TC-2.3b GET /oauth/callback reaches handler unauthenticated (exempt)", async () => {
		const { app } = await buildServer({ inMemoryDb: true });
		await app.ready();

		try {
			const response = await app.inject({
				method: "GET",
				url: "/oauth/callback",
			});

			expect(response.statusCode).toBe(501);
			expect(response.json()).toMatchObject({
				error: { code: "NOT_IMPLEMENTED" },
			});
		} finally {
			await app.close();
		}
	});

	it("TC-7.3a GET /oauth/callback passes without Origin header", async () => {
		const { app } = await buildServer({ inMemoryDb: true });
		await app.ready();

		try {
			const response = await app.inject({
				method: "GET",
				url: "/oauth/callback",
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

	it("TC-3.4a server-only mode: GET /oauth/callback responds", async () => {
		const { app } = await buildServer({ inMemoryDb: true });
		await app.ready();

		try {
			const response = await app.inject({
				method: "GET",
				url: "/oauth/callback",
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
