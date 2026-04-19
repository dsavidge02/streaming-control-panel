import type { FastifyInstance } from "fastify";
import { PATHS } from "@panel/shared";
import { registerRoute } from "../server/registerRoute.js";

const HEARTBEAT_INTERVAL_MS = 15_000;

export function registerLiveEventsRoute(app: FastifyInstance): void {
	registerRoute(app, {
		method: "GET",
		url: PATHS.live.events,
		handler: async (req, reply) => {
			reply.hijack();
			reply.raw.writeHead(200, {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
				"X-Accel-Buffering": "no",
			});

			const emitHeartbeat = () => {
				reply.raw.write(
					"event: heartbeat\ndata: " +
						JSON.stringify({ type: "heartbeat", data: {} }) +
						"\n\n",
				);
			};

			const interval = setInterval(() => {
				emitHeartbeat();
			}, HEARTBEAT_INTERVAL_MS);

			req.raw.on("close", () => {
				clearInterval(interval);
			});

			emitHeartbeat();

			return reply;
		},
	});
}
