import { SignInButton } from "@/components/SignInButton";

export function Hero() {
	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.4em]">
				<span className="text-[var(--panel-accent)]">◆ STAGE 01</span>
				<span className="text-[var(--panel-ink-muted)]">—</span>
				<span className="text-[var(--panel-primary)]">
					APP SHELL &amp; LANDING
				</span>
			</div>
			<h1
				className="leading-[0.85]"
				style={{
					color: "var(--panel-ink)",
					fontFamily: "'Press Start 2P', monospace",
					fontSize: "clamp(38px, 5.5vw, 78px)",
					textShadow:
						"3px 3px 0 var(--panel-primary), 6px 6px 0 var(--panel-accent)",
				}}
			>
				RUN YOUR
				<br />
				STREAM.
				<br />
				<span
					style={{
						color: "var(--panel-accent)",
						textShadow: "3px 3px 0 var(--panel-primary)",
					}}
				>
					ONE MACHINE.
				</span>
			</h1>
			<p className="max-w-xl text-[14px] leading-relaxed text-[var(--panel-ink)]">
				A local desktop panel for the solo Twitch streamer. Channel config, mod
				actions, clips, !commands, welcome bot — installed on your rig and bound
				to your broadcaster. No bot provider UI. No templated copy. No cloud.
			</p>
			<div className="flex flex-wrap items-start gap-6">
				<SignInButton />
				<div className="pt-4 text-[11px] uppercase tracking-[0.3em] text-[var(--panel-ink-muted)]">
					→ POST /auth/login
				</div>
			</div>
		</div>
	);
}
