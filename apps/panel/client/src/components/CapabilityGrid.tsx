const capabilities = [
	{
		description:
			"Title, category, tags, language, content labels, branded flag.",
		number: "01",
		title: "Channel management",
	},
	{
		description: "Timeout, ban, delete — anchored on the chat message itself.",
		number: "02",
		title: "Live moderation",
	},
	{
		description: "One click. Draft returned. Finalize later in Twitch.",
		number: "03",
		title: "Clip creation",
	},
	{
		description: "Your words. Role-tiered: MOD, VIP, GENERAL.",
		number: "04",
		title: "Custom !commands",
	},
	{
		description: "First-time chatter detection keyed on Twitch user_id.",
		number: "05",
		title: "Welcome bot",
	},
] as const;

export function CapabilityGrid() {
	return (
		<section className="relative z-10 px-5 pb-10 pt-2 sm:px-8 lg:px-10">
			<h2 className="mb-4 text-[10px] uppercase tracking-[0.4em] text-[var(--panel-accent)]">
				◆ CAPABILITIES ◆
			</h2>
			<ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
				{capabilities.map((capability) => (
					<li
						key={capability.number}
						className="border bg-[var(--panel-bg-panel-overlay)] p-4 transition-transform hover:-translate-y-1"
						style={{
							borderColor: "var(--panel-primary)",
							boxShadow: "4px 4px 0 var(--panel-accent)",
						}}
					>
						<div
							className="mb-3 text-[28px] leading-none text-[var(--panel-accent)]"
							style={{
								fontFamily: "'Press Start 2P', monospace",
								textShadow: "2px 2px 0 var(--panel-primary)",
							}}
						>
							{capability.number}
						</div>
						<h3 className="mb-2 text-[11px] uppercase tracking-[0.15em] text-[var(--panel-ink)]">
							{capability.title}
						</h3>
						<p className="text-[11px] leading-relaxed text-[var(--panel-ink-muted)]">
							{capability.description}
						</p>
					</li>
				))}
			</ul>
		</section>
	);
}
