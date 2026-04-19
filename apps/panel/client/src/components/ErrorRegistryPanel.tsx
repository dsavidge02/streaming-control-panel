import { ERROR_CODES } from "@panel/shared";

import { useSignIn } from "@/hooks/useSignIn";

export function ErrorRegistryPanel() {
	const signIn = useSignIn();

	return (
		<section
			className="border bg-[var(--panel-bg-panel-overlay)] p-5"
			style={{ borderColor: "var(--panel-accent)" }}
		>
			<h2 className="mb-3 text-[10px] uppercase tracking-[0.35em] text-[var(--panel-primary)]">
				☰ ERROR REGISTRY
			</h2>
			<dl className="space-y-1 text-[11px] uppercase tracking-[0.2em]">
				{Object.entries(ERROR_CODES).map(([code, details]) => {
					const active = signIn.state === "error" && signIn.code === code;

					return (
						<div
							key={code}
							aria-current={active ? "true" : undefined}
							className="flex items-center justify-between gap-4"
						>
							<dt
								style={{
									color: active ? "var(--panel-primary)" : "var(--panel-ink)",
									fontWeight: active ? 700 : 400,
								}}
							>
								{code}
							</dt>
							<dd className="text-[var(--panel-accent)]">{details.status}</dd>
						</div>
					);
				})}
			</dl>
		</section>
	);
}
