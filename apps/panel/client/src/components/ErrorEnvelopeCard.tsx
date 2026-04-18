import { ERROR_CODES, type ErrorCode } from "@panel/shared";

export interface ErrorEnvelopeCardProps {
	code: ErrorCode;
	message: string;
	onDismiss?: () => void;
}

export function ErrorEnvelopeCard({
	code,
	message,
	onDismiss,
}: ErrorEnvelopeCardProps) {
	const status = ERROR_CODES[code].status;
	const rawEnvelope = JSON.stringify({ error: { code, message } });

	return (
		<div
			className="mt-5 max-w-xl border bg-[var(--panel-bg)] p-5"
			role="alert"
			style={{
				borderColor: "var(--panel-primary)",
				boxShadow: "6px 6px 0 var(--panel-accent)",
			}}
		>
			<div className="mb-3 flex items-center gap-3">
				<div
					aria-hidden="true"
					className="grid h-6 w-6 place-items-center text-xs font-bold"
					style={{
						background: "var(--panel-primary)",
						color: "var(--panel-primary-ink)",
					}}
				>
					!
				</div>
				<div className="text-[11px] uppercase tracking-[0.35em] text-[var(--panel-accent)]">
					ERROR · {status} · {code}
				</div>
			</div>
			<p className="text-[13px] leading-relaxed text-[var(--panel-ink)]">
				{message}
			</p>
			<pre className="mt-3 overflow-x-auto text-[10px] tracking-wide text-[var(--panel-ink-muted)]">
				{rawEnvelope}
			</pre>
			<button
				aria-label="Dismiss error"
				className="panel-focus mt-3 text-[10px] uppercase tracking-[0.35em] text-[var(--panel-accent)]"
				onClick={onDismiss}
				type="button"
			>
				◀ CONTINUE?
			</button>
		</div>
	);
}
