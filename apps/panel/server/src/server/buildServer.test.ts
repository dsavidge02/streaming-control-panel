import { describe, expect, it, vi } from "vitest";
import { type buildServer, startServer } from "./buildServer.js";
import { loadConfig } from "./config.js";

describe("buildServer", () => {
	it("TC-7.1a resolved config targets 127.0.0.1:7077", () => {
		const config = loadConfig();

		expect(config.host).toBe("127.0.0.1");
		expect(config.port).toBe(7077);
	});

	it("startServer wires config host+port into app.listen", async () => {
		type BuiltServer = Awaited<ReturnType<typeof buildServer>>;
		const listen = vi.fn().mockResolvedValue("ok");
		const close = vi.fn().mockResolvedValue(undefined);
		const build = vi.fn().mockResolvedValue({
			app: {
				listen,
				close,
			} as unknown as BuiltServer["app"],
			db: {} as BuiltServer["db"],
			config: {
				...loadConfig(),
				host: "127.0.0.1",
				port: 7077,
			},
		} satisfies BuiltServer);

		const result = await startServer(build);

		expect(build).toHaveBeenCalledTimes(1);
		expect(listen).toHaveBeenCalledWith({
			host: "127.0.0.1",
			port: 7077,
		});
		expect(result.url).toBe("http://127.0.0.1:7077");
		await result.close();
		expect(close).toHaveBeenCalledTimes(1);
	});
});
