import { sealData } from "iron-session";

export const FIXTURE_COOKIE_SECRET = "test-secret-32-chars-minimum-padding";

export interface SealFixtureOptions {
	password?: string;
	broadcasterId?: string;
	issuedAt?: number;
	ttlSeconds?: number;
}

export async function sealFixtureSession(
	options: SealFixtureOptions = {},
): Promise<string> {
	return sealData(
		{
			broadcasterId: options.broadcasterId ?? "test-broadcaster-id",
			issuedAt: options.issuedAt ?? Date.now(),
		},
		{
			password: options.password ?? FIXTURE_COOKIE_SECRET,
			ttl: options.ttlSeconds ?? 7 * 24 * 3600,
		},
	);
}
