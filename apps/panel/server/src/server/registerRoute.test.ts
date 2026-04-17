import { PATHS } from "@panel/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as originPreHandlerModule from "../gate/originPreHandler.js";
import { buildTestServer } from "../test/buildTestServer.js";
import { registerRoute } from "./registerRoute.js";

vi.mock("../gate/originPreHandler.js", async () => {
	const actual = await vi.importActual<
		typeof import("../gate/originPreHandler.js")
	>("../gate/originPreHandler.js");

	return {
		...actual,
		originPreHandler: vi.fn(actual.originPreHandler),
	};
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("registerRoute", () => {
	it("returns AUTH_REQUIRED for a gated route with no gate-specific code", async () => {
		const { app } = await buildTestServer();

		try {
			registerRoute(app, {
				method: "GET",
				url: "/test-gated",
				handler: async () => ({ ok: true }),
			});

			const response = await app.inject({
				method: "GET",
				url: "/test-gated",
			});

			expect(response.statusCode).toBe(401);
			expect(response.json()).toMatchObject({
				error: { code: "AUTH_REQUIRED" },
			});
		} finally {
			await app.close();
		}
	});

	it("throws when exempt is true for a path outside GATE_EXEMPT_PATHS", async () => {
		const { app } = await buildTestServer();

		try {
			expect(() =>
				registerRoute(app, {
					method: "GET",
					url: "/not-in-list",
					exempt: true,
					handler: async () => ({}),
				}),
			).toThrow(/GATE_EXEMPT_PATHS|gateExempt/);
		} finally {
			await app.close();
		}
	});

	it("runs originPreHandler for state-changing exempt routes", async () => {
		const { app } = await buildTestServer();

		try {
			registerRoute(app, {
				method: "POST",
				url: PATHS.auth.login,
				exempt: true,
				handler: async () => ({ ok: true }),
			});

			const response = await app.inject({
				method: "POST",
				url: PATHS.auth.login,
			});

			// This locks in the registrar wiring without depending on Story 4's real Origin behavior.
			expect(
				vi.mocked(originPreHandlerModule.originPreHandler),
			).toHaveBeenCalled();
			expect(response.statusCode).toBe(200);
		} finally {
			await app.close();
		}
	});
});
