import { PATHS } from "./paths.js";

export const GATE_EXEMPT_PATHS = Object.freeze([
	PATHS.auth.login,
	PATHS.oauth.callback,
] as const);
