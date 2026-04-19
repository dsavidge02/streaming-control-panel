import { CapabilityGrid } from "@/components/CapabilityGrid";
import { ErrorRegistryPanel } from "@/components/ErrorRegistryPanel";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { NavBar } from "@/components/NavBar";
import { RedirectFlash } from "@/components/RedirectFlash";
import { SystemStatusPanel } from "@/components/SystemStatusPanel";
import { PaletteSwitcher } from "@/palette/PaletteSwitcher";
import { SignInProvider } from "@/hooks/useSignIn";

function BackgroundLayers() {
	return (
		<>
			<div className="landing-scanlines" aria-hidden="true" />
			<div className="landing-mesh" aria-hidden="true" />
			<div className="landing-grid" aria-hidden="true" />
		</>
	);
}

export function Landing() {
	return (
		<SignInProvider>
			<div
				className="relative min-h-screen overflow-hidden bg-[var(--panel-bg)] text-[var(--panel-ink)]"
				data-testid="landing-root"
				style={{ fontFamily: "'Space Mono', monospace" }}
			>
				<BackgroundLayers />
				<Marquee />
				<div className="relative z-10">
					<NavBar />
					<RedirectFlash />
					<main className="px-5 pb-8 pt-4 sm:px-8 lg:px-10">
						<div className="grid grid-cols-12 gap-6">
							<section className="col-span-12 lg:col-span-8">
								<Hero />
							</section>
							<aside className="col-span-12 space-y-4 lg:col-span-4">
								<SystemStatusPanel />
								<ErrorRegistryPanel />
								<PaletteSwitcher />
							</aside>
						</div>
					</main>
					<CapabilityGrid />
					<Footer />
				</div>
			</div>
		</SignInProvider>
	);
}
