import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

function isAuthenticated(): boolean {
	return false;
}

export function RequireAuth({ children }: { children: ReactNode }) {
	const location = useLocation();

	if (!isAuthenticated()) {
		return (
			<Navigate to="/" state={{ redirectedFrom: location.pathname }} replace />
		);
	}

	return <>{children}</>;
}
