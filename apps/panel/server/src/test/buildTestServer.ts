import { buildServer, type BuildServerOptions } from "../server/buildServer.js";

export async function buildTestServer(
	overrides: Partial<BuildServerOptions> = {},
) {
	const { config, ...rest } = overrides;

	return buildServer({
		inMemoryDb: true,
		...rest,
		config: {
			port: 0,
			allowedOrigins: ["http://localhost:5173", "app://panel"],
			cookieSecret: "test-secret-32-chars-minimum-padding",
			...(config ?? {}),
		},
	});
}
