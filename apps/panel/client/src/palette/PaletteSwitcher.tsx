import { useEffect, useId, useRef, useState } from "react";

import { PALETTES, PALETTE_ORDER } from "@/palette/palettes";
import { usePalette } from "@/palette/usePalette";

export function PaletteSwitcher() {
	const { palette, setPalette } = usePalette();
	const [open, setOpen] = useState(false);
	const paneId = useId();
	const switcherRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) {
			return;
		}

		const handlePointerDown = (event: MouseEvent | TouchEvent) => {
			if (
				switcherRef.current &&
				event.target instanceof Node &&
				!switcherRef.current.contains(event.target)
			) {
				setOpen(false);
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handlePointerDown);
		document.addEventListener("touchstart", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("touchstart", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [open]);

	return (
		<div ref={switcherRef} className="fixed right-4 top-4 z-50">
			{open ? (
				<section
					aria-label="Palette options"
					className="w-[min(92vw,26rem)] border px-3 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
					id={paneId}
					style={{
						background: "#0a0a0a",
						borderColor: "#333",
						color: "#e5e5e5",
					}}
				>
					<div className="mb-2 flex items-start justify-between gap-3">
						<div className="text-[10px] uppercase tracking-[0.3em] text-[#8a8a8a]">
							Neo-Arcade · palette study
						</div>
						<button
							aria-label="Close palette switcher"
							className="panel-focus border px-2 py-1 text-[10px] uppercase tracking-[0.22em] transition-transform hover:-translate-y-0.5"
							onClick={() => setOpen(false)}
							type="button"
							style={{
								background: "transparent",
								borderColor: "#333",
								color: "#e5e5e5",
							}}
						>
							×
						</button>
					</div>
					<div className="flex flex-wrap gap-2">
						{PALETTE_ORDER.map((id) => {
							const item = PALETTES[id];
							const active = id === palette.id;

							return (
								<button
									key={id}
									aria-label={`Use ${item.name} palette`}
									aria-pressed={active}
									className="panel-focus flex items-center gap-2 border px-3 py-2 text-[10px] uppercase tracking-[0.22em] transition-transform hover:-translate-y-0.5"
									onClick={() => setPalette(id)}
									type="button"
									style={{
										background: active ? "#e5e5e5" : "transparent",
										borderColor: active ? "#e5e5e5" : "#333",
										color: active ? "#0a0a0a" : "#aaa",
									}}
								>
									<span aria-hidden="true" className="flex">
										<span
											className="h-3 w-3 border border-[#444]"
											style={{ background: item.bg }}
										/>
										<span
											className="h-3 w-3"
											style={{ background: item.primary }}
										/>
										<span
											className="h-3 w-3"
											style={{ background: item.accent }}
										/>
									</span>
									<span>{item.name}</span>
								</button>
							);
						})}
					</div>
					<div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] tracking-wide text-[#8a8a8a]">
						<span className="text-[#e5e5e5]">{palette.name}</span>
						<span>·</span>
						<span>{palette.tag}</span>
						<span>·</span>
						<span>{palette.blurb}</span>
					</div>
				</section>
			) : (
				<button
					aria-controls={paneId}
					aria-expanded={open}
					aria-label="Open palette switcher"
					className="panel-focus flex items-center gap-3 border px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-0.5"
					onClick={() => setOpen(true)}
					type="button"
					style={{
						background: "#0a0a0a",
						borderColor: "#333",
						color: "#e5e5e5",
					}}
				>
					<span aria-hidden="true" className="flex">
						<span
							className="h-3 w-3 border border-[#444]"
							style={{ background: palette.bg }}
						/>
						<span className="h-3 w-3" style={{ background: palette.primary }} />
						<span className="h-3 w-3" style={{ background: palette.accent }} />
					</span>
					<span className="text-[10px] uppercase tracking-[0.22em]">
						{palette.name}
					</span>
					<span aria-hidden="true" className="text-[10px] text-[#8a8a8a]">
						v
					</span>
				</button>
			)}
		</div>
	);
}
