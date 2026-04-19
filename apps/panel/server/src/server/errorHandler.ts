import type { FastifyError, FastifyInstance } from "fastify";
import { AppError, ERROR_CODES } from "@panel/shared";

export function registerErrorHandler(app: FastifyInstance): void {
	app.setErrorHandler((error, request, reply) => {
		if (error instanceof AppError) {
			reply.status(error.status).send({
				error: { code: error.code, message: error.message },
			});
			return;
		}

		if ((error as FastifyError).validation) {
			reply.status(400).send({
				error: {
					code: "INPUT_INVALID",
					message: "Request validation failed.",
				},
			});
			return;
		}

		request.log.error({ err: error }, "unhandled error");
		reply.status(500).send({
			error: {
				code: "SERVER_ERROR",
				message: ERROR_CODES.SERVER_ERROR.defaultMessage,
			},
		});
	});
}
