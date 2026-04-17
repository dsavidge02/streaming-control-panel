import { errorEnvelopeSchema } from "@panel/shared";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { describe, expect, it } from "vitest";
import { buildTestServer } from "../test/buildTestServer.js";

describe("registerErrorHandler", () => {
	it("TC-8.1d returns a 500 SERVER_ERROR envelope without leaking thrown details", async () => {
		const { app } = await buildTestServer();

		try {
			app.get("/test-throw-generic", async () => {
				throw new Error("SENSITIVE_STACK_SHOULD_NOT_LEAK");
			});

			const response = await app.inject({
				method: "GET",
				url: "/test-throw-generic",
			});
			const payload = response.json();

			expect(response.statusCode).toBe(500);
			expect(payload).toMatchObject({
				error: { code: "SERVER_ERROR" },
			});
			expect(payload.error.message.length).toBeGreaterThan(0);
			expect(payload.error.message).not.toContain(
				"SENSITIVE_STACK_SHOULD_NOT_LEAK",
			);
		} finally {
			await app.close();
		}
	});

	it("TC-8.2a central error handler catches thrown errors from routes", async () => {
		const { app } = await buildTestServer();

		try {
			app.get("/test-throw-boom", async () => {
				throw new Error("boom");
			});

			const response = await app.inject({
				method: "GET",
				url: "/test-throw-boom",
			});
			const payload = response.json();

			expect(response.statusCode).toBe(500);
			expect(errorEnvelopeSchema.safeParse(payload).success).toBe(true);
			expect(payload).toMatchObject({
				error: { code: "SERVER_ERROR" },
			});
		} finally {
			await app.close();
		}
	});

	it("returns INPUT_INVALID for Zod validation failures", async () => {
		const { app } = await buildTestServer();

		try {
			app.withTypeProvider<ZodTypeProvider>().route({
				method: "POST",
				url: "/test-zod",
				schema: {
					body: z.object({
						x: z.number(),
					}),
				},
				handler: async () => ({}),
			});

			const response = await app.inject({
				method: "POST",
				url: "/test-zod",
				payload: { x: "not-a-number" },
			});

			expect(response.statusCode).toBe(400);
			expect(response.json()).toMatchObject({
				error: { code: "INPUT_INVALID" },
			});
		} finally {
			await app.close();
		}
	});
});
