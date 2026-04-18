import { ERROR_CODES } from "@panel/shared";

import { useSignIn } from "@/hooks/useSignIn";

function loginStatus(state: ReturnType<typeof useSignIn>) {
	if (state.state === "pending") {
		return { label: "PENDING", ok: false };
	}

	if (state.state === "error" && state.code) {
		return { label: String(ERROR_CODES[state.code].status), ok: false };
	}

	if (state.state === "success") {
		return { label: "READY", ok: true };
	}

	return { label: "IDLE", ok: true };
}

function StatusRow({
	label,
	ok,
	value,
}: {
	label: string;
	ok: boolean;
	value: string;
}) {
	return (
		<li className="flex items-center justify-between gap-4 py-1 text-[11px] uppercase tracking-[0.2em]">
			<span className="flex items-center gap-2 text-[var(--panel-ink)]">
				<span
					aria-hidden="true"
					className="h-1.5 w-1.5"
					style={{
						background: ok ? "var(--panel-accent)" : "var(--panel-primary)",
					}}
				/>
				{label}
			</span>
			<span
				style={{
					color: ok ? "var(--panel-accent)" : "var(--panel-primary)",
					fontWeight: 700,
				}}
			>
				{value}
			</span>
		</li>
	);
}

export function SystemStatusPanel() {
	const signIn = useSignIn();
	const authRow = loginStatus(signIn);

	return (
		<section
			className="border bg-[var(--panel-bg-panel-overlay)] p-5"
			style={{ borderColor: "var(--panel-primary)" }}
		>
			<h2 className="mb-3 text-[10px] uppercase tracking-[0.35em] text-[var(--panel-accent)]">
				▣ SYSTEM STATUS
			</h2>
			<ul>
				<StatusRow label="SSE /live/events" ok value="HEARTBEAT" />
				<StatusRow
					label="POST /auth/login"
					ok={authRow.ok}
					value={authRow.label}
				/>
				<StatusRow label="ORIGIN CHECK" ok value="ALLOWLIST" />
				<StatusRow label="SQLITE" ok value="BASELINE" />
				<StatusRow label="BIND 127.0.0.1" ok value="PORT 7077" />
			</ul>
		</section>
	);
}
