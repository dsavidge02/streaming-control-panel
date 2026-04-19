import fastifyCookie from "@fastify/cookie";
import Fastify from "fastify";
import {
	type ZodTypeProvider,
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod";
import { applyMigrations, openDatabase } from "../data/db.js";
import { registerAuthRoutes } from "../routes/auth.js";
import { registerOauthCallbackRoute } from "../routes/oauthCallback.js";
import { registerLiveEventsRoute } from "../routes/liveEvents.js";
import { loadConfig, type ServerConfig } from "./config.js";
import { registerErrorHandler } from "./errorHandler.js";

export interface BuildServerOptions {
	config?: Partial<ServerConfig>;
	inMemoryDb?: boolean;
}

export async function buildServer(options: BuildServerOptions = {}) {
	const config: ServerConfig = {
		...loadConfig(),
		...options.config,
	};
	const dbFilePath =
		options.inMemoryDb === true ? ":memory:" : config.databasePath;
	const db = await openDatabase(dbFilePath);
	await applyMigrations(db);
	const app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();

	app.setValidatorCompiler(validatorCompiler);
	app.setSerializerCompiler(serializerCompiler);
	app.decorate("config", config);
	await app.register(fastifyCookie, { secret: config.cookieSecret });
	registerErrorHandler(app);
	registerAuthRoutes(app);
	registerOauthCallbackRoute(app);
	registerLiveEventsRoute(app);

	return { app, db, config };
}

export async function startServer(
	// Injectable for tests; production callers omit this argument.
	buildFn: () => ReturnType<typeof buildServer> = buildServer,
): Promise<{
	url: string;
	close: () => Promise<void>;
}> {
	const { app, config } = await buildFn();
	await app.listen({ host: config.host, port: config.port });

	return {
		url: `http://${config.host}:${config.port}`,
		close: () => app.close(),
	};
}
