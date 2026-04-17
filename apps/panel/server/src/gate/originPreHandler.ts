import type { FastifyReply, FastifyRequest } from "fastify";

export async function originPreHandler(
	_req: FastifyRequest,
	_reply: FastifyReply,
): Promise<void> {
	return;
}
