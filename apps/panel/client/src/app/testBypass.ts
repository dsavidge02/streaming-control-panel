import type { ErrorCode } from "@panel/shared";

import type { SignInState } from "@/hooks/useSignIn";
import type { PaletteId } from "@/palette/palettes";
import { isPaletteId } from "@/palette/persistence";

export type ForcedState =
	| "default"
	| "sign-in-pending"
	| "sign-in-error-501"
	| "sign-in-error-403"
	| "sign-in-error-500"
	| "redirect-home"
	| "redirect-settings";

export interface ForcedStateResolved {
	signIn?: {
		code: ErrorCode | null;
		message: string;
		state: SignInState;
	};
	redirectedFrom?: string;
	palette?: PaletteId;
}

export function isTestBypassEnabled(): boolean {
	return import.meta.env.DEV;
}

export function readForcedState(): ForcedStateResolved | null {
	if (!isTestBypassEnabled()) return null;
	if (!import.meta.env.DEV) return null;

	const params = new URLSearchParams(window.location.search);
	const forceState = params.get("forceState") as ForcedState | null;
	const palette = params.get("palette");

	if (!forceState && !palette) {
		return null;
	}

	const resolved: ForcedStateResolved = {};

	if (palette && isPaletteId(palette)) {
		resolved.palette = palette;
	}

	switch (forceState) {
		case "sign-in-pending":
			resolved.signIn = { code: null, message: "", state: "pending" };
			break;
		case "sign-in-error-501":
			resolved.signIn = {
				code: "NOT_IMPLEMENTED",
				message:
					"Sign-in is wired but Epic 2 (Twitch OAuth) has not yet landed.",
				state: "error",
			};
			break;
		case "sign-in-error-403":
			resolved.signIn = {
				code: "ORIGIN_REJECTED",
				message:
					"The request origin was rejected by the local server. Restart the app if this persists.",
				state: "error",
			};
			break;
		case "sign-in-error-500":
			resolved.signIn = {
				code: "SERVER_ERROR",
				message: "Unexpected error. Check the server log and retry.",
				state: "error",
			};
			break;
		case "redirect-home":
			resolved.redirectedFrom = "/home";
			break;
		case "redirect-settings":
			resolved.redirectedFrom = "/settings";
			break;
		default:
			break;
	}

	return resolved;
}
