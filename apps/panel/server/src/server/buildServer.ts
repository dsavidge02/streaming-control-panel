import Fastify from "fastify";
import {
	type ZodTypeProvider,
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod";
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
	const db = options.inMemoryDb === true ? ":memory:-stub" : null;
	const app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();

	app.setValidatorCompiler(validatorCompiler);
	app.setSerializerCompiler(serializerCompiler);
	app.decorate("config", config);
	registerErrorHandler(app);

	return { app, db, config };
}

export async function startServer(): Promise<{
	url: string;
	close: () => Promise<void>;
}> {
	const { app, config } = await buildServer();
	await app.listen({ host: config.host, port: config.port });

	return {
		url: `http://${config.host}:${config.port}`,
		close: () => app.close(),
	};
}
