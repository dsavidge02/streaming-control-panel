import { PATHS, errorEnvelopeSchema } from "@panel/shared";
import { describe, expect, it } from "vitest";
import { registerRoute } from "../server/registerRoute.js";
import { buildTestServer } from "../test/buildTestServer.js";

describe("originPreHandler", () => {
	it("TC-7.2a POST /auth/login rejects mismatched Origin with 403", async () => {
		const { app } = await buildTestServer();

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

	it("TC-7.2b POST /auth/login rejects missing Origin with 403", async () => {
		const { app } = await buildTestServer();

		try {
			const response = await app.inject({
				method: "POST",
				url: PATHS.auth.login,
			});

			expect(response.statusCode).toBe(403);
			expect(response.json()).toMatchObject({
				error: { code: "ORIGIN_REJECTED" },
			});
		} finally {
			await app.close();
		}
	});

	it("TC-7.4a Origin rejected before session on a gated non-exempt state-changing route (no cookie + bad Origin -> 403 not 401)", async () => {
		const { app } = await buildTestServer();

		try {
			registerRoute(app, {
				method: "POST",
				url: "/test-gated-post",
				handler: async () => ({ ok: true }),
			});

			const response = await app.inject({
				method: "POST",
				url: "/test-gated-post",
				headers: { Origin: "http://evil.com" },
			});

			// If the preHandler order were reversed ([session, origin]), session would throw 401 AUTH_REQUIRED first. 403 here proves Origin runs first.
			expect(response.statusCode).toBe(403);
			expect(response.json().error.code).toBe("ORIGIN_REJECTED");
		} finally {
			await app.close();
		}
	});

	it("TC-8.1b 403 envelope shape", async () => {
		const { app } = await buildTestServer();

		try {
			const response = await app.inject({
				method: "POST",
				url: PATHS.auth.login,
				headers: { Origin: "http://evil.com" },
			});
			const body = response.json();

			expect(response.statusCode).toBe(403);
			expect(errorEnvelopeSchema.safeParse(body).success).toBe(true);
			expect(body).toEqual({
				error: {
					code: "ORIGIN_REJECTED",
					message: expect.any(String),
				},
			});
			expect(body.error.message.length).toBeGreaterThan(0);
		} finally {
			await app.close();
		}
	});
});
