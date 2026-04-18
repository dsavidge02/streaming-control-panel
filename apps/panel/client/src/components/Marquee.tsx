const marqueeContent =
	"★ PLAYER ONE READY ★ INSERT COIN ★ NOW LOADING APP SHELL v0.1 ★ LOCAL · SINGLE-INSTALL · BOUND TO BROADCASTER ★ PRESS START ★";

export function Marquee() {
	return (
		<div
			aria-hidden="true"
			className="relative z-10 overflow-hidden border-b border-[var(--panel-primary)] bg-[var(--panel-bg-panel)]"
		>
			<div className="marquee-anim flex min-w-max gap-8 py-2 text-[11px] uppercase tracking-[0.3em] text-[var(--panel-accent)]">
				<span>{marqueeContent}</span>
				<span>{marqueeContent}</span>
			</div>
		</div>
	);
}
