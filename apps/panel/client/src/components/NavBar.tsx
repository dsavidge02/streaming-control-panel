interface NavBarProps {
	onGatedNavigate?: (path: string | null) => void;
}

const tabs = [
	{ label: "HOME", path: "/", gated: false },
	{ label: "PLAY", path: "/home", gated: true },
	{ label: "OPTIONS", path: "/settings", gated: true },
] as const;

export function NavBar({ onGatedNavigate }: NavBarProps) {
	return (
		<nav className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
			<div className="flex items-center gap-3">
				<div
					className="grid h-9 w-9 place-items-center border border-[var(--panel-bg)] text-lg font-bold text-[var(--panel-primary-ink)]"
					style={{
						background: "var(--panel-primary)",
						boxShadow: "4px 4px 0 var(--panel-accent)",
					}}
				>
					▶
				</div>
				<div>
					<div className="text-[10px] uppercase tracking-[0.4em] text-[var(--panel-accent)]">
						{"CONTROL//PANEL"}
					</div>
					<div className="text-[9px] uppercase tracking-[0.3em] text-[var(--panel-ink-muted)]">
						v0.1 · electron
					</div>
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.3em]">
				{tabs.map((tab) => {
					const isActive = tab.path === "/";
					return (
						<button
							key={tab.path}
							aria-current={isActive ? "page" : undefined}
							className="panel-focus border px-4 py-2 transition-transform hover:-translate-y-0.5"
							onClick={() => {
								if (tab.gated) {
									onGatedNavigate?.(tab.path);
									return;
								}
								onGatedNavigate?.(null);
							}}
							type="button"
							style={{
								background: isActive ? "var(--panel-primary)" : "transparent",
								borderColor: isActive
									? "var(--panel-primary)"
									: "var(--panel-rule)",
								boxShadow: isActive ? "4px 4px 0 var(--panel-accent)" : "none",
								color: isActive
									? "var(--panel-primary-ink)"
									: "var(--panel-ink)",
							}}
						>
							<span>{tab.label}</span>
							{tab.gated ? (
								<>
									{" "}
									<span aria-hidden="true">◈</span>
									<span className="sr-only">requires authentication</span>
								</>
							) : null}
						</button>
					);
				})}
			</div>
		</nav>
	);
}
