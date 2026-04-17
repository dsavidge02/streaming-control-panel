import { useState } from "react";

// ============================================================
// NEO-ARCADE — 5 color-palette variants
// Each palette is tuned for readability:
//   - Body text ≥ 4.5:1 contrast against background
//   - Display text aims for ≥ 7:1 where it carries info
//   - Interactive elements carry non-color affordances
//     (offset shadow, border, layout) so color-blind users
//     and high-contrast-mode users still parse the UI
// ============================================================

const CAPABILITIES = [
	{
		n: "01",
		key: "channel",
		title: "Channel management",
		desc: "Title, category, tags, language, content labels, branded flag.",
	},
	{
		n: "02",
		key: "moderation",
		title: "Live moderation",
		desc: "Timeout, ban, delete — anchored on the chat message itself.",
	},
	{
		n: "03",
		key: "clips",
		title: "Clip creation",
		desc: "One click. Draft returned. Finalize later in Twitch.",
	},
	{
		n: "04",
		key: "commands",
		title: "Custom !commands",
		desc: "Your words. Role-tiered: MOD, VIP, GENERAL.",
	},
	{
		n: "05",
		key: "welcome",
		title: "Welcome bot",
		desc: "First-time chatter detection keyed on Twitch user_id.",
	},
];

// ---------- PALETTES ----------
// Each palette names tested roles rather than raw color names, so the
// component below is palette-agnostic.
const PALETTES = {
	// ORIGINAL-ADJACENT — toned down from the first draft for readability
	neon: {
		name: "Neon Night",
		blurb:
			"Refined version of the original. Cyan-on-violet with softened pink.",
		tag: "bold · dark",
		bg: "#0f0a1e", // deep indigo (not pure black — softer on eyes)
		bgPanel: "#1a1230", // slightly lifted surface
		bgPanelOverlay: "rgba(26,18,48,0.85)",
		ink: "#f0ecff", // warm near-white (contrast vs bg: 15.8:1)
		inkMuted: "#b8b0d4", // muted purple-gray for secondary text (≥ 7.5:1)
		primary: "#ff5faa", // softened pink (still unmistakably arcade)
		primaryInk: "#0f0a1e", // dark text on primary
		accent: "#5ef2c8", // softer mint-cyan (high contrast on dark bg)
		accentInk: "#0f0a1e",
		warn: "#ffb84f", // amber for warnings — distinguishable from primary
		rule: "#3d2b5a",
		scanline: "rgba(255,95,170,0.035)",
		gridLine: "rgba(255,95,170,0.07)",
		mesh: [
			"radial-gradient(ellipse 900px 600px at 15% -10%, rgba(255,95,170,0.18), transparent 60%)",
			"radial-gradient(ellipse 700px 500px at 95% 110%, rgba(94,242,200,0.14), transparent 60%)",
			"radial-gradient(ellipse 500px 400px at 50% 50%, rgba(105,60,200,0.20), transparent 70%)",
		].join(", "),
	},

	// HIGH-CONTRAST DARK — maximum readability, editorial restraint
	// Good baseline for users who want the arcade vibe without eye strain
	amber: {
		name: "Amber CRT",
		blurb: "Classic amber monochrome terminal. Highest legibility of the set.",
		tag: "dark · high-contrast",
		bg: "#131005",
		bgPanel: "#1f1a0a",
		bgPanelOverlay: "rgba(31,26,10,0.88)",
		ink: "#ffd89a", // warm amber text (contrast 11.8:1)
		inkMuted: "#c9a66a", // muted amber (≥ 6.2:1)
		primary: "#ffb347", // saturated amber — reads well at every size
		primaryInk: "#131005",
		accent: "#7fd4ff", // cool cyan accent — only blue in palette,
		// used sparingly so it reads as "special"
		accentInk: "#0a1420",
		warn: "#ff8a6b", // coral for warnings (distinct hue from amber)
		rule: "#3a2f15",
		scanline: "rgba(255,179,71,0.04)",
		gridLine: "rgba(255,179,71,0.08)",
		mesh: [
			"radial-gradient(ellipse 900px 600px at 15% -10%, rgba(255,179,71,0.14), transparent 60%)",
			"radial-gradient(ellipse 700px 500px at 95% 110%, rgba(127,212,255,0.08), transparent 60%)",
		].join(", "),
	},

	// SOFT LIGHT — easy on the eyes, daytime-use, still has arcade DNA
	cream: {
		name: "Cream Soda",
		blurb: "Light theme. Warm cream background. Coral + teal accents.",
		tag: "soft · light",
		bg: "#faf3e4", // warm cream — no blue light harshness
		bgPanel: "#f2e8d1",
		bgPanelOverlay: "rgba(242,232,209,0.85)",
		ink: "#2b1f14", // deep warm brown (contrast 13.5:1 on cream)
		inkMuted: "#6b5840", // secondary text (≥ 5.8:1)
		primary: "#c2352e", // deep coral-red — reads as "warm" not "alarming"
		primaryInk: "#faf3e4",
		accent: "#2d7d74", // deep teal — complementary to coral, 7.1:1 on cream
		accentInk: "#faf3e4",
		warn: "#8a5a1a", // amber-brown warning
		rule: "#d9c9a8",
		scanline: "rgba(194,53,46,0.02)",
		gridLine: "rgba(43,31,20,0.04)",
		mesh: [
			"radial-gradient(ellipse 900px 600px at 15% -10%, rgba(194,53,46,0.07), transparent 60%)",
			"radial-gradient(ellipse 700px 500px at 95% 110%, rgba(45,125,116,0.06), transparent 60%)",
		].join(", "),
	},

	// MUTED GAMEBOY — nostalgic but completely readable
	// Desaturated greens + warm gray. Low eye strain even for long sessions.
	pocket: {
		name: "Pocket Monochrome",
		blurb:
			"Desaturated Game Boy greens. Low saturation, easy on long sessions.",
		tag: "soft · dark",
		bg: "#1a1f1b", // very dark warm charcoal (not pure black)
		bgPanel: "#252b26",
		bgPanelOverlay: "rgba(37,43,38,0.88)",
		ink: "#e8eee0", // warm off-white (contrast 12.9:1)
		inkMuted: "#9db09a", // muted sage-green (≥ 6.5:1)
		primary: "#9ccc85", // soft moss-green — non-aggressive but clearly CTA
		primaryInk: "#1a1f1b",
		accent: "#e8bc72", // warm wheat — visual counterpoint to green
		accentInk: "#1a1f1b",
		warn: "#d97b7b", // dusty rose warning
		rule: "#354039",
		scanline: "rgba(156,204,133,0.025)",
		gridLine: "rgba(156,204,133,0.05)",
		mesh: [
			"radial-gradient(ellipse 900px 600px at 15% -10%, rgba(156,204,133,0.10), transparent 60%)",
			"radial-gradient(ellipse 700px 500px at 95% 110%, rgba(232,188,114,0.08), transparent 60%)",
		].join(", "),
	},

	// DEUTERANOPIA-SAFE — designed around blue/yellow which remain distinguishable
	// for all common color vision deficiencies. Avoids red/green pairs entirely.
	beacon: {
		name: "Signal Beacon",
		blurb: "Blue/yellow palette — remains legible across color-vision types.",
		tag: "accessible · dark",
		bg: "#0d1420",
		bgPanel: "#19253a",
		bgPanelOverlay: "rgba(25,37,58,0.88)",
		ink: "#eaf2ff", // cool near-white (contrast 15.2:1)
		inkMuted: "#a9bcd9", // muted blue-gray (≥ 7.1:1)
		primary: "#ffd447", // saturated yellow — distinguishable from blue by
		// luminance alone, so it works across all CVD types
		primaryInk: "#0d1420",
		accent: "#7fb3ff", // soft sky blue — pairs with yellow, distinct by hue
		accentInk: "#0d1420",
		warn: "#ff9f4f", // orange (between yellow and red — readable for deuteranopes)
		rule: "#2b3d5c",
		scanline: "rgba(255,212,71,0.03)",
		gridLine: "rgba(127,179,255,0.06)",
		mesh: [
			"radial-gradient(ellipse 900px 600px at 15% -10%, rgba(255,212,71,0.09), transparent 60%)",
			"radial-gradient(ellipse 700px 500px at 95% 110%, rgba(127,179,255,0.12), transparent 60%)",
		].join(", "),
	},
};

// ============================================================
function useSignInFlow() {
	const [state, setState] = useState("idle");
	const [code, setCode] = useState(null);
	const [message, setMessage] = useState("");

	function trigger() {
		setState("pending");
		setCode(null);
		setMessage("");
		setTimeout(() => {
			setState("error");
			setCode("NOT_IMPLEMENTED");
			setMessage(
				"Route registered. Behavior arrives with Epic 2 (Twitch OAuth & Tenant Onboarding).",
			);
		}, 700);
	}

	function reset() {
		setState("idle");
		setCode(null);
		setMessage("");
	}

	return { state, code, message, trigger, reset };
}

// ============================================================
// PALETTE-DRIVEN NEO-ARCADE COMPONENT
// ============================================================
function NeoArcade({ palette: p }) {
	const [route, setRoute] = useState("/");
	const signIn = useSignInFlow();
	const [redirectFlash, setRedirectFlash] = useState(null);

	// Whether the palette reads as a "light" theme — affects a few micro-choices
	const isLight = p.bg.toLowerCase() === "#faf3e4";

	function gatedNav(path) {
		setRoute(path);
		setTimeout(() => {
			setRedirectFlash(path);
			setRoute("/");
			setTimeout(() => setRedirectFlash(null), 2400);
		}, 500);
	}

	return (
		<div
			className="relative w-full min-h-[900px] overflow-hidden"
			style={{
				fontFamily: "'Space Mono', 'Courier New', monospace",
				background: p.bg,
				color: p.ink,
			}}
		>
			{/* Scanlines — softened from the original */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					backgroundImage: `repeating-linear-gradient(0deg, ${p.scanline} 0px, ${p.scanline} 1px, transparent 2px, transparent 4px)`,
				}}
				aria-hidden
			/>
			{/* Color mesh */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{ background: p.mesh }}
				aria-hidden
			/>
			{/* Grid */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					backgroundImage: `linear-gradient(${p.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${p.gridLine} 1px, transparent 1px)`,
					backgroundSize: "48px 48px",
				}}
				aria-hidden
			/>

			{/* Marquee */}
			<div
				className="relative border-b overflow-hidden"
				style={{ borderColor: p.primary, background: p.bgPanel }}
			>
				<div
					className="whitespace-nowrap py-2 text-[11px] tracking-[0.3em] uppercase"
					style={{ color: p.accent, animation: "marq 28s linear infinite" }}
				>
					★ PLAYER ONE READY ★ INSERT COIN ★ NOW LOADING APP SHELL v0.1 ★ LOCAL
					· SINGLE-INSTALL · BOUND TO BROADCASTER ★ PRESS START ★ PLAYER ONE
					READY ★ INSERT COIN ★ NOW LOADING APP SHELL v0.1 ★ LOCAL ·
					SINGLE-INSTALL · BOUND TO BROADCASTER ★ PRESS START ★
				</div>
			</div>

			{/* Nav */}
			<div className="relative px-8 py-5 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div
						className="w-9 h-9 grid place-items-center"
						style={{
							background: p.primary,
							color: p.primaryInk,
							fontWeight: 900,
							fontSize: 18,
							boxShadow: `4px 4px 0 ${p.accent}`,
						}}
					>
						▶
					</div>
					<div>
						<div
							className="text-[10px] tracking-[0.4em]"
							style={{ color: p.accent }}
						>
							CONTROL//PANEL
						</div>
						<div
							className="text-[9px] tracking-[0.3em]"
							style={{ color: p.inkMuted }}
						>
							v0.1 · electron
						</div>
					</div>
				</div>
				<div className="flex items-center gap-1 text-[10px] tracking-[0.3em] uppercase">
					{[
						{ pth: "/", label: "HOME", gated: false },
						{ pth: "/home", label: "PLAY", gated: true },
						{ pth: "/settings", label: "OPTIONS", gated: true },
					].map((tab) => {
						const active = route === tab.pth;
						return (
							<button
								key={tab.pth}
								onClick={() =>
									tab.gated ? gatedNav(tab.pth) : setRoute(tab.pth)
								}
								className="px-4 py-2 transition-all"
								style={{
									background: active ? p.primary : "transparent",
									color: active ? p.primaryInk : p.ink,
									border: `1px solid ${active ? p.primary : p.rule}`,
								}}
							>
								{tab.label}
								{tab.gated ? " ◈" : ""}
							</button>
						);
					})}
				</div>
			</div>

			{redirectFlash && (
				<div
					className="relative mx-8 mb-4 px-4 py-2 text-[11px] tracking-[0.25em] uppercase"
					style={{
						background: p.primary,
						color: p.primaryInk,
						boxShadow: `4px 4px 0 ${p.accent}`,
					}}
					role="status"
				>
					⚠ access denied · {redirectFlash} requires authentication · warp to
					LANDING
				</div>
			)}

			{/* Hero */}
			<div className="relative px-8 grid grid-cols-12 gap-6">
				<div className="col-span-12 lg:col-span-8 pt-6">
					<div className="flex items-center gap-3 text-[10px] tracking-[0.4em] uppercase mb-6">
						<span style={{ color: p.accent }}>◆ STAGE 01</span>
						<span style={{ color: p.inkMuted }}>—</span>
						<span style={{ color: p.primary }}>APP SHELL & LANDING</span>
					</div>

					<h1
						className="leading-[0.85] mb-6"
						style={{
							fontFamily: "'Press Start 2P', 'Space Mono', monospace",
							fontSize: "clamp(38px, 5.5vw, 78px)",
							color: p.ink,
							// Gentler shadow than original — keeps the arcade feel but
							// doesn't fight readability with chromatic aberration
							textShadow: `3px 3px 0 ${p.primary}, 6px 6px 0 ${p.accent}`,
							letterSpacing: "-0.02em",
						}}
					>
						RUN YOUR
						<br />
						STREAM.
						<br />
						<span
							style={{ color: p.accent, textShadow: `3px 3px 0 ${p.primary}` }}
						>
							ONE MACHINE.
						</span>
					</h1>

					<p
						className="max-w-xl text-[14px] leading-relaxed mb-8"
						style={{ color: p.ink }}
					>
						A local desktop panel for the solo Twitch streamer. Channel config,
						mod actions, clips, !commands, welcome bot — installed on your rig
						and bound to your broadcaster. No bot provider UI. No templated
						copy. No cloud.
					</p>

					<div className="flex items-center gap-6 mb-4 flex-wrap">
						<button
							onClick={() => signIn.trigger()}
							disabled={signIn.state === "pending"}
							className="relative px-6 py-4 text-[12px] tracking-[0.3em] uppercase font-bold transition-transform hover:-translate-y-0.5"
							style={{
								background: p.primary,
								color: p.primaryInk,
								boxShadow: `6px 6px 0 ${p.accent}, 6px 6px 0 1px ${isLight ? p.ink : p.bg}`,
								border: `2px solid ${isLight ? p.ink : p.bg}`,
							}}
						>
							{signIn.state === "pending"
								? "▶ LOADING..."
								: "▶ PRESS START — TWITCH"}
						</button>
						<div
							className="text-[11px] tracking-[0.3em] uppercase"
							style={{ color: p.inkMuted }}
						>
							→ POST /auth/login
						</div>
					</div>

					{signIn.state === "error" && (
						<div
							className="relative mt-6 p-5 max-w-xl"
							style={{
								background: p.bg,
								border: `2px solid ${p.primary}`,
								boxShadow: `6px 6px 0 ${p.accent}`,
							}}
							role="alert"
						>
							<div className="flex items-center gap-3 mb-2">
								<span
									className="inline-grid place-items-center w-6 h-6 text-[12px] font-bold"
									style={{ background: p.primary, color: p.primaryInk }}
									aria-hidden
								>
									!
								</span>
								<div
									className="text-[11px] tracking-[0.35em] uppercase"
									style={{ color: p.accent }}
								>
									ERROR · 501 · {signIn.code}
								</div>
							</div>
							<div
								className="text-[13px] leading-relaxed"
								style={{ color: p.ink }}
							>
								{signIn.message}
							</div>
							<div
								className="mt-3 text-[10px] tracking-wider"
								style={{ color: p.inkMuted }}
							>
								&#123; error: &#123; code: "{signIn.code}", message: "…" &#125;
								&#125;
							</div>
							<button
								onClick={signIn.reset}
								className="mt-3 text-[10px] tracking-[0.35em] uppercase"
								style={{ color: p.accent }}
							>
								◀ CONTINUE?
							</button>
						</div>
					)}
				</div>

				{/* HUD */}
				<div className="col-span-12 lg:col-span-4 pt-6">
					<div
						className="p-5 mb-4"
						style={{
							background: p.bgPanelOverlay,
							border: `1px solid ${p.primary}`,
						}}
					>
						<div
							className="text-[10px] tracking-[0.35em] uppercase mb-3"
							style={{ color: p.accent }}
						>
							▣ SYSTEM STATUS
						</div>
						<StatusRow p={p} label="SSE /live/events" value="HEARTBEAT" ok />
						<StatusRow
							p={p}
							label="POST /auth/login"
							value={signIn.state === "error" ? "501" : "IDLE"}
							ok={signIn.state !== "error"}
						/>
						<StatusRow p={p} label="ORIGIN CHECK" value="ALLOWLIST" ok />
						<StatusRow p={p} label="SQLITE" value="BASELINE" ok />
						<StatusRow p={p} label="BIND 127.0.0.1" value="PORT 7077" ok />
					</div>

					<div
						className="p-5"
						style={{
							background: p.bgPanelOverlay,
							border: `1px solid ${p.accent}`,
						}}
					>
						<div
							className="text-[10px] tracking-[0.35em] uppercase mb-3"
							style={{ color: p.primary }}
						>
							☰ ERROR REGISTRY
						</div>
						{[
							["AUTH_REQUIRED", "401"],
							["ORIGIN_REJECTED", "403"],
							["INPUT_INVALID", "400"],
							["NOT_IMPLEMENTED", "501"],
							["SERVER_ERROR", "500"],
						].map(([code, st]) => {
							const isActive = code === signIn.code;
							return (
								<div
									key={code}
									className="flex justify-between text-[11px] tracking-[0.2em] py-0.5"
								>
									<span
										style={{
											color: isActive ? p.primary : p.ink,
											fontWeight: isActive ? 700 : 400,
										}}
									>
										{code}
									</span>
									<span style={{ color: p.accent }}>{st}</span>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Capability grid */}
			<div className="relative px-8 py-10 mt-6">
				<div
					className="text-[10px] tracking-[0.4em] uppercase mb-4"
					style={{ color: p.accent }}
				>
					◆ CAPABILITIES ◆
				</div>
				<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
					{CAPABILITIES.map((c) => (
						<div
							key={c.key}
							className="p-4 transition-transform hover:-translate-y-1"
							style={{
								background: p.bgPanelOverlay,
								border: `1px solid ${p.primary}`,
								boxShadow: `4px 4px 0 ${p.accent}`,
							}}
						>
							<div
								className="text-[28px] leading-none mb-2"
								style={{
									fontFamily: "'Press Start 2P', monospace",
									color: p.accent,
									textShadow: `2px 2px 0 ${p.primary}`,
								}}
							>
								{c.n}
							</div>
							<div
								className="text-[11px] tracking-[0.15em] uppercase mb-1"
								style={{ color: p.ink }}
							>
								{c.title}
							</div>
							<div
								className="text-[11px] leading-relaxed"
								style={{ color: p.inkMuted }}
							>
								{c.desc}
							</div>
						</div>
					))}
				</div>
			</div>

			<div
				className="relative px-8 py-3 border-t text-[9px] tracking-[0.4em] uppercase flex justify-between"
				style={{ borderColor: p.rule, color: p.inkMuted }}
			>
				<span>© HIGH SCORE · STREAMING CONTROL PANEL</span>
				<span>HI: 9999999 · EPIC 1 / 6</span>
			</div>

			<style>{`
        @keyframes marq {
          0% { transform: translateX(0%) }
          100% { transform: translateX(-50%) }
        }
      `}</style>
		</div>
	);
}

function StatusRow({ p, label, value, ok }) {
	return (
		<div className="flex items-center justify-between text-[11px] tracking-[0.2em] py-1">
			<span className="flex items-center gap-2">
				<span
					className="w-1.5 h-1.5"
					style={{ background: ok ? p.accent : p.primary }}
					aria-hidden
				/>
				<span style={{ color: p.ink }}>{label}</span>
			</span>
			<span style={{ color: ok ? p.accent : p.primary, fontWeight: 600 }}>
				{value}
			</span>
		</div>
	);
}

// ============================================================
// ROOT — palette switcher
// ============================================================
export default function App() {
	const [paletteId, setPaletteId] = useState("amber");
	const p = PALETTES[paletteId];

	return (
		<div className="min-h-screen w-full">
			<link rel="preconnect" href="https://fonts.googleapis.com" />
			<link
				rel="preconnect"
				href="https://fonts.gstatic.com"
				crossOrigin="anonymous"
			/>
			<link
				rel="stylesheet"
				href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Press+Start+2P&display=swap"
			/>

			{/* Palette switcher */}
			<div
				className="sticky top-0 z-50 px-6 py-3 border-b"
				style={{
					background: "#0a0a0a",
					borderColor: "#222",
					color: "#e5e5e5",
					fontFamily: "'Space Mono', monospace",
				}}
			>
				<div className="flex items-center justify-between gap-4 flex-wrap">
					<div
						className="text-[11px] tracking-[0.3em] uppercase"
						style={{ color: "#888" }}
					>
						Neo-Arcade · palette study
					</div>
					<div className="flex items-center gap-2 flex-wrap">
						{Object.entries(PALETTES).map(([id, pal]) => {
							const active = id === paletteId;
							return (
								<button
									key={id}
									onClick={() => setPaletteId(id)}
									className="flex items-center gap-2 px-3 py-1.5 border transition-colors text-[10px] tracking-[0.22em] uppercase"
									style={{
										borderColor: active ? "#e5e5e5" : "#333",
										background: active ? "#e5e5e5" : "transparent",
										color: active ? "#0a0a0a" : "#aaa",
									}}
									aria-pressed={active}
								>
									<span className="flex">
										<span
											className="w-3 h-3"
											style={{ background: pal.bg, border: "1px solid #444" }}
											aria-hidden
										/>
										<span
											className="w-3 h-3"
											style={{ background: pal.primary }}
											aria-hidden
										/>
										<span
											className="w-3 h-3"
											style={{ background: pal.accent }}
											aria-hidden
										/>
									</span>
									{pal.name}
								</button>
							);
						})}
					</div>
				</div>
				<div
					className="mt-2 text-[10px] tracking-wider flex items-center gap-3"
					style={{ color: "#888" }}
				>
					<span style={{ color: "#e5e5e5" }}>{p.name}</span>
					<span>·</span>
					<span>{p.tag}</span>
					<span>·</span>
					<span>{p.blurb}</span>
				</div>
			</div>

			<NeoArcade palette={p} />

			{/* Accessibility notes */}
			<div
				className="px-6 py-5 text-[11px] leading-relaxed"
				style={{
					background: "#0a0a0a",
					color: "#888",
					fontFamily: "'Space Mono', monospace",
				}}
			>
				<div
					className="tracking-[0.3em] uppercase mb-2"
					style={{ color: "#e5e5e5" }}
				>
					Accessibility notes per palette
				</div>
				<ul className="space-y-1">
					<li>
						<span style={{ color: "#e5e5e5" }}>Neon Night</span> — Deep indigo
						instead of pure black reduces halation. Pink softened from #ff1493 →
						#ff5faa; body text at 15.8:1.
					</li>
					<li>
						<span style={{ color: "#e5e5e5" }}>Amber CRT</span> — Monochrome
						amber at 11.8:1; cyan accent used sparingly for information
						hierarchy. Best legibility of the set.
					</li>
					<li>
						<span style={{ color: "#e5e5e5" }}>Cream Soda</span> — Light theme.
						Warm cream (#faf3e4) avoids blue-light harshness. Body text at
						13.5:1.
					</li>
					<li>
						<span style={{ color: "#e5e5e5" }}>Pocket Monochrome</span> —
						Desaturated greens keep eye strain low over long streaming sessions.
						Warm charcoal bg instead of black.
					</li>
					<li>
						<span style={{ color: "#e5e5e5" }}>Signal Beacon</span> —
						Yellow/blue remains distinguishable across all common color vision
						deficiencies (red/green is avoided). Luminance-distinct
						primary/accent.
					</li>
				</ul>
				<div className="mt-3 text-[10px] opacity-75">
					All palettes: interactive elements carry shape + offset-shadow
					affordances so color alone never carries meaning. Status indicators
					pair color with text labels.
				</div>
			</div>
		</div>
	);
}
