import { ErrorEnvelopeCard } from "@/components/ErrorEnvelopeCard";
import { useSignIn } from "@/hooks/useSignIn";

export function SignInButton() {
	const { code, message, reset, state, trigger } = useSignIn();
	const pending = state === "pending";

	return (
		<div>
			<button
				aria-disabled={pending}
				aria-label="Sign in with Twitch"
				className="panel-focus border px-6 py-4 text-[12px] font-bold uppercase tracking-[0.3em] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed"
				disabled={pending}
				onClick={() => {
					void trigger();
				}}
				type="button"
				style={{
					background: "var(--panel-primary)",
					borderColor: "var(--panel-bg)",
					boxShadow:
						"6px 6px 0 var(--panel-accent), 6px 6px 0 1px var(--panel-bg)",
					color: "var(--panel-primary-ink)",
				}}
			>
				{pending ? "▶ LOADING..." : "▶ PRESS START — TWITCH"}
			</button>
			{state === "error" && code ? (
				<ErrorEnvelopeCard code={code} message={message} onDismiss={reset} />
			) : null}
		</div>
	);
}
