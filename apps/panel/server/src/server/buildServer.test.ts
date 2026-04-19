import { describe, expect, it, vi } from "vitest";
import { buildServer } from "./buildServer.js";
import { loadConfig } from "./config.js";

describe("buildServer", () => {
	it("TC-7.1a resolved config targets 127.0.0.1:7077", () => {
		const config = loadConfig();

		expect(config.host).toBe("127.0.0.1");
		expect(config.port).toBe(7077);
	});

	it("app.listen receives host and port from resolved config", async () => {
		const result = await buildServer({ inMemoryDb: true });

		try {
			const listenSpy = vi
				.spyOn(result.app, "listen")
				.mockResolvedValue("ok" as never);

			await result.app.listen({
				host: result.config.host,
				port: result.config.port,
			});

			expect(listenSpy).toHaveBeenCalledWith({
				host: "127.0.0.1",
				port: 7077,
			});
		} finally {
			await result.app.close();
		}
	});
});
