import { describe, expect, it } from "vitest";
import { registerRoute } from "../server/registerRoute.js";
import { buildTestServer } from "../test/buildTestServer.js";
import { sealFixtureSession } from "../test/sealFixtureSession.js";

const TEST_SECRET = "test-secret-32-chars-minimum-padding";

describe("sessionPreHandler", () => {
	it("missing cookie on gated route returns 401 AUTH_REQUIRED", async () => {
		const { app } = await buildTestServer();

		try {
			registerRoute(app, {
				method: "GET",
				url: "/test-session-missing",
				handler: async () => ({ ok: true }),
			});
			const response = await app.inject({
				method: "GET",
				url: "/test-session-missing",
			});

			expect(response.statusCode).toBe(401);
			expect(response.json()).toMatchObject({
				error: { code: "AUTH_REQUIRED" },
			});
		} finally {
			await app.close();
		}
	});

	it("malformed cookie on gated route returns 401 AUTH_REQUIRED", async () => {
		const { app } = await buildTestServer();

		try {
			registerRoute(app, {
				method: "GET",
				url: "/test-session-bad",
				handler: async () => ({ ok: true }),
			});
			const response = await app.inject({
				method: "GET",
				url: "/test-session-bad",
				headers: { cookie: "panel_session=not-a-valid-seal" },
			});

			expect(response.statusCode).toBe(401);
			expect(response.json()).toMatchObject({
				error: { code: "AUTH_REQUIRED" },
			});
		} finally {
			await app.close();
		}
	});

	it("valid sealed cookie on gated route reaches the handler", async () => {
		const { app } = await buildTestServer();

		try {
			registerRoute(app, {
				method: "GET",
				url: "/test-session-ok",
				handler: async () => ({ ok: true }),
			});
			const sealed = await sealFixtureSession({ password: TEST_SECRET });
			const response = await app.inject({
				method: "GET",
				url: "/test-session-ok",
				headers: { cookie: `panel_session=${sealed}` },
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toEqual({ ok: true });
		} finally {
			await app.close();
		}
	});
});
