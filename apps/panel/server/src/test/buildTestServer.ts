import { buildServer, type BuildServerOptions } from "../server/buildServer.js";
import { FIXTURE_COOKIE_SECRET } from "./sealFixtureSession.js";

export async function buildTestServer(
	overrides: Partial<BuildServerOptions> = {},
) {
	const { config, ...rest } = overrides;

	return buildServer({
		inMemoryDb: true,
		timerMode: "fake",
		...rest,
		config: {
			port: 0,
			allowedOrigins: ["http://localhost:5173", "app://panel"],
			cookieSecret: FIXTURE_COOKIE_SECRET,
			...(config ?? {}),
		},
	});
}
