import { PATHS } from "@panel/shared";

import { apiFetch, type ApiResult } from "@/api/fetchClient";

export async function postAuthLogin(): Promise<ApiResult<{ flow?: string }>> {
	return apiFetch<{ flow?: string }>(PATHS.auth.login, { method: "POST" });
}
