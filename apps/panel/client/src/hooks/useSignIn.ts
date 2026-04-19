import {
	createContext,
	createElement,
	useContext,
	useMemo,
	useState,
} from "react";
import type { ReactNode } from "react";

import type { ErrorCode } from "@panel/shared";

import { readForcedState } from "@/app/testBypass";
import { postAuthLogin } from "@/api/authApi";

export type SignInState = "idle" | "pending" | "error" | "success";

export interface UseSignInReturn {
	state: SignInState;
	code: ErrorCode | null;
	message: string;
	trigger: () => Promise<void>;
	reset: () => void;
}

const SignInContext = createContext<UseSignInReturn | null>(null);

export function messageFor(code: ErrorCode, serverMessage: string): string {
	switch (code) {
		case "NOT_IMPLEMENTED":
			return `Sign-in is wired but Epic 2 (Twitch OAuth) has not yet landed. ${serverMessage}`;
		case "ORIGIN_REJECTED":
			return "The request origin was rejected by the local server. Restart the app if this persists.";
		case "INPUT_INVALID":
			return `Request validation failed: ${serverMessage}`;
		case "AUTH_REQUIRED":
			return "Authentication required.";
		case "SERVER_ERROR":
			return "Unexpected error. Check the server log and retry.";
	}
}

export function SignInProvider({ children }: { children: ReactNode }) {
	const forced = readForcedState()?.signIn;
	const [state, setState] = useState<SignInState>(forced?.state ?? "idle");
	const [code, setCode] = useState<ErrorCode | null>(forced?.code ?? null);
	const [message, setMessage] = useState(forced?.message ?? "");

	const value = useMemo<UseSignInReturn>(
		() => ({
			code,
			message,
			reset: () => {
				setState("idle");
				setCode(null);
				setMessage("");
			},
			state,
			trigger: async () => {
				setState("pending");
				setCode(null);
				setMessage("");

				const result = await postAuthLogin();

				if (result.status === "error") {
					setState("error");
					setCode(result.code);
					setMessage(messageFor(result.code, result.message));
					return;
				}

				if (result.data.flow) {
					window.location.assign(result.data.flow);
					return;
				}

				setState("success");
			},
		}),
		[code, message, state],
	);

	return createElement(SignInContext.Provider, { value }, children);
}

export function useSignIn() {
	const context = useContext(SignInContext);

	if (!context) {
		throw new Error("useSignIn must be used within a SignInProvider");
	}

	return context;
}
