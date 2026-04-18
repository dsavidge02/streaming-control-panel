export type PaletteId = "neon" | "amber" | "cream" | "pocket" | "beacon";

export interface Palette {
	id: PaletteId;
	name: string;
	blurb: string;
	tag: string;
	bg: string;
	bgPanel: string;
	bgPanelOverlay: string;
	ink: string;
	inkMuted: string;
	primary: string;
	primaryInk: string;
	accent: string;
	accentInk: string;
	warn: string;
	rule: string;
	scanline: string;
	gridLine: string;
	mesh: string;
}

export const PALETTE_ORDER = [
	"neon",
	"amber",
	"cream",
	"pocket",
	"beacon",
] as const satisfies readonly PaletteId[];

export const PALETTES: Record<PaletteId, Palette> = {
	neon: {
		id: "neon",
		name: "Neon Night",
		blurb:
			"Refined version of the original. Cyan-on-violet with softened pink.",
		tag: "bold · dark",
		bg: "#0f0a1e",
		bgPanel: "#1a1230",
		bgPanelOverlay: "rgba(26,18,48,0.85)",
		ink: "#f0ecff",
		inkMuted: "#b8b0d4",
		primary: "#ff5faa",
		primaryInk: "#0f0a1e",
		accent: "#5ef2c8",
		accentInk: "#0f0a1e",
		warn: "#ffb84f",
		rule: "#3d2b5a",
		scanline: "rgba(255,95,170,0.035)",
		gridLine: "rgba(255,95,170,0.07)",
		mesh: [
			"radial-gradient(ellipse 900px 600px at 15% -10%, rgba(255,95,170,0.18), transparent 60%)",
			"radial-gradient(ellipse 700px 500px at 95% 110%, rgba(94,242,200,0.14), transparent 60%)",
			"radial-gradient(ellipse 500px 400px at 50% 50%, rgba(105,60,200,0.20), transparent 70%)",
		].join(", "),
	},
	amber: {
		id: "amber",
		name: "Amber CRT",
		blurb: "Classic amber monochrome terminal. Highest legibility of the set.",
		tag: "dark · high-contrast",
		bg: "#131005",
		bgPanel: "#1f1a0a",
		bgPanelOverlay: "rgba(31,26,10,0.88)",
		ink: "#ffd89a",
		inkMuted: "#c9a66a",
		primary: "#ffb347",
		primaryInk: "#131005",
		accent: "#7fd4ff",
		accentInk: "#0a1420",
		warn: "#ff8a6b",
		rule: "#3a2f15",
		scanline: "rgba(255,179,71,0.04)",
		gridLine: "rgba(255,179,71,0.08)",
		mesh: [
			"radial-gradient(ellipse 900px 600px at 15% -10%, rgba(255,179,71,0.14), transparent 60%)",
			"radial-gradient(ellipse 700px 500px at 95% 110%, rgba(127,212,255,0.08), transparent 60%)",
		].join(", "),
	},
	cream: {
		id: "cream",
		name: "Cream Soda",
		blurb: "Light theme. Warm cream background. Coral + teal accents.",
		tag: "soft · light",
		bg: "#faf3e4",
		bgPanel: "#f2e8d1",
		bgPanelOverlay: "rgba(242,232,209,0.85)",
		ink: "#2b1f14",
		inkMuted: "#6b5840",
		primary: "#c2352e",
		primaryInk: "#faf3e4",
		accent: "#2d7d74",
		accentInk: "#faf3e4",
		warn: "#8a5a1a",
		rule: "#d9c9a8",
		scanline: "rgba(194,53,46,0.02)",
		gridLine: "rgba(43,31,20,0.04)",
		mesh: [
			"radial-gradient(ellipse 900px 600px at 15% -10%, rgba(194,53,46,0.07), transparent 60%)",
			"radial-gradient(ellipse 700px 500px at 95% 110%, rgba(45,125,116,0.06), transparent 60%)",
		].join(", "),
	},
	pocket: {
		id: "pocket",
		name: "Pocket Monochrome",
		blurb:
			"Desaturated Game Boy greens. Low saturation, easy on long sessions.",
		tag: "soft · dark",
		bg: "#1a1f1b",
		bgPanel: "#252b26",
		bgPanelOverlay: "rgba(37,43,38,0.88)",
		ink: "#e8eee0",
		inkMuted: "#9db09a",
		primary: "#9ccc85",
		primaryInk: "#1a1f1b",
		accent: "#e8bc72",
		accentInk: "#1a1f1b",
		warn: "#d97b7b",
		rule: "#354039",
		scanline: "rgba(156,204,133,0.025)",
		gridLine: "rgba(156,204,133,0.05)",
		mesh: [
			"radial-gradient(ellipse 900px 600px at 15% -10%, rgba(156,204,133,0.10), transparent 60%)",
			"radial-gradient(ellipse 700px 500px at 95% 110%, rgba(232,188,114,0.08), transparent 60%)",
		].join(", "),
	},
	beacon: {
		id: "beacon",
		name: "Signal Beacon",
		blurb: "Blue/yellow palette — remains legible across color-vision types.",
		tag: "accessible · dark",
		bg: "#0d1420",
		bgPanel: "#19253a",
		bgPanelOverlay: "rgba(25,37,58,0.88)",
		ink: "#eaf2ff",
		inkMuted: "#a9bcd9",
		primary: "#ffd447",
		primaryInk: "#0d1420",
		accent: "#7fb3ff",
		accentInk: "#0d1420",
		warn: "#ff9f4f",
		rule: "#2b3d5c",
		scanline: "rgba(255,212,71,0.03)",
		gridLine: "rgba(127,179,255,0.06)",
		mesh: [
			"radial-gradient(ellipse 900px 600px at 15% -10%, rgba(255,212,71,0.09), transparent 60%)",
			"radial-gradient(ellipse 700px 500px at 95% 110%, rgba(127,179,255,0.12), transparent 60%)",
		].join(", "),
	},
};

export const DEFAULT_PALETTE_ID: PaletteId = "amber";
