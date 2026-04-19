import type { FastifyInstance, RouteOptions } from "fastify";
import { GATE_EXEMPT_PATHS } from "@panel/shared";
import { originPreHandler } from "../gate/originPreHandler.js";
import { sessionPreHandler } from "../gate/sessionPreHandler.js";

export interface RouteSpec extends Omit<RouteOptions, "preHandler" | "url"> {
	url: string;
	method: NonNullable<RouteOptions["method"]>;
	exempt?: boolean;
	preHandler?: RouteOptions["preHandler"];
}

function toPreHandlerArray(
	preHandler: RouteOptions["preHandler"],
): NonNullable<RouteOptions["preHandler"]> extends readonly (infer T)[]
	? T[]
	: never {
	if (!preHandler) {
		return [] as never;
	}

	return (Array.isArray(preHandler) ? preHandler : [preHandler]) as never;
}

export function registerRoute(app: FastifyInstance, spec: RouteSpec): void {
	if (
		spec.exempt === true &&
		!(GATE_EXEMPT_PATHS as readonly string[]).includes(spec.url)
	) {
		throw new Error(
			`registerRoute: route ${spec.url} is marked exempt but not in GATE_EXEMPT_PATHS. ` +
				"Add it to apps/panel/shared/src/http/gateExempt.ts if this is intentional.",
		);
	}

	const method = Array.isArray(spec.method) ? spec.method[0] : spec.method;
	if (!method) {
		throw new Error(`registerRoute: route ${spec.url} must declare a method.`);
	}
	const stateMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(
		method.toUpperCase(),
	);
	const customPreHandlers = toPreHandlerArray(spec.preHandler);
	const preHandler = [
		...(stateMutating ? [originPreHandler] : []),
		...(!spec.exempt ? [sessionPreHandler] : []),
		...customPreHandlers,
	];

	app.route({
		...spec,
		preHandler: preHandler.length > 0 ? preHandler : undefined,
	});
}
