import { useEffect, useMemo, useState } from "react";
import { useInRouterContext, useLocation } from "react-router";

import { readForcedState } from "@/app/testBypass";

function Flash({ redirectedFrom }: { redirectedFrom: string }) {
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setVisible(false);
		}, 2400);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, []);

	if (!visible) {
		return null;
	}

	return (
		<div
			aria-live="polite"
			className="relative z-10 mx-5 mb-4 border border-[var(--panel-primary)] bg-[var(--panel-primary)] px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-[var(--panel-primary-ink)] sm:mx-8 lg:mx-10"
			role="status"
			style={{ boxShadow: "6px 4px 0 var(--panel-accent)" }}
		>
			⚠ ACCESS DENIED · {redirectedFrom} REQUIRES AUTHENTICATION · WARP TO
			LANDING
		</div>
	);
}

function RouterRedirectFlash() {
	const location = useLocation();
	const redirectedFrom = useMemo(() => {
		const state = location.state as { redirectedFrom?: string } | null;
		return state?.redirectedFrom ?? null;
	}, [location.state]);

	return redirectedFrom ? (
		<Flash key={redirectedFrom} redirectedFrom={redirectedFrom} />
	) : null;
}

export function RedirectFlash() {
	const forcedState = readForcedState()?.redirectedFrom ?? null;
	const inRouterContext = useInRouterContext();

	if (forcedState) {
		return <Flash key={forcedState} redirectedFrom={forcedState} />;
	}

	return inRouterContext ? <RouterRedirectFlash /> : null;
}
