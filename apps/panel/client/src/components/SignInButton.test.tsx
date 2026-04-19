import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { postAuthLogin } from "@/api/authApi";
import { SignInButton } from "@/components/SignInButton";
import { SignInProvider } from "@/hooks/useSignIn";
import { renderWithRouter } from "@/test/renderWithRouter";

vi.mock("@/api/authApi", () => ({
	postAuthLogin: vi.fn(),
}));

const mockedPostAuthLogin = vi.mocked(postAuthLogin);

function renderSignInButton() {
	return renderWithRouter(
		<SignInProvider>
			<SignInButton />
		</SignInProvider>,
	);
}

describe("SignInButton", () => {
	beforeEach(() => {
		mockedPostAuthLogin.mockReset();
	});

	test("TC-1.3a: sign-in button is active", () => {
		renderSignInButton();

		expect(
			screen.getByRole("button", { name: "Sign in with Twitch" }),
		).toBeEnabled();
	});

	test("TC-1.3b: activation invokes POST /auth/login", async () => {
		mockedPostAuthLogin.mockResolvedValue({
			status: "error",
			code: "NOT_IMPLEMENTED",
			httpStatus: 501,
			message: "Sign-in is wired but Epic 2 (Twitch OAuth) has not yet landed.",
		});

		renderSignInButton();
		const user = userEvent.setup();
		await user.click(
			screen.getByRole("button", { name: "Sign in with Twitch" }),
		);

		expect(mockedPostAuthLogin).toHaveBeenCalledTimes(1);
	});

	test("TC-1.3c: renderer surfaces error message keyed to error code", async () => {
		mockedPostAuthLogin.mockResolvedValue({
			status: "error",
			code: "NOT_IMPLEMENTED",
			httpStatus: 501,
			message: "server says foo",
		});

		renderSignInButton();
		const user = userEvent.setup();
		await user.click(
			screen.getByRole("button", { name: "Sign in with Twitch" }),
		);

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Epic 2 (Twitch OAuth) has not yet landed. server says foo",
		);
	});

	test("button shows LOADING during pending state", async () => {
		mockedPostAuthLogin.mockImplementation(
			() => new Promise(() => {}) as ReturnType<typeof postAuthLogin>,
		);

		renderSignInButton();
		const user = userEvent.setup();
		await user.click(
			screen.getByRole("button", { name: "Sign in with Twitch" }),
		);

		expect(
			screen.getByRole("button", { name: "Sign in with Twitch" }),
		).toBeDisabled();
		expect(screen.getByText("▶ LOADING...")).toBeInTheDocument();
	});

	test("button shows error card on ORIGIN_REJECTED", async () => {
		mockedPostAuthLogin.mockResolvedValue({
			status: "error",
			code: "ORIGIN_REJECTED",
			httpStatus: 403,
			message: "origin rejected",
		});

		renderSignInButton();
		const user = userEvent.setup();
		await user.click(
			screen.getByRole("button", { name: "Sign in with Twitch" }),
		);

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"ERROR · 403 · ORIGIN_REJECTED",
		);
	});

	test("reset clears error state", async () => {
		mockedPostAuthLogin.mockResolvedValue({
			status: "error",
			code: "SERVER_ERROR",
			httpStatus: 500,
			message: "boom",
		});

		renderSignInButton();
		const user = userEvent.setup();
		await user.click(
			screen.getByRole("button", { name: "Sign in with Twitch" }),
		);
		await user.click(
			await screen.findByRole("button", { name: "Dismiss error" }),
		);

		await waitFor(() => {
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		});
		expect(
			screen.getByRole("button", { name: "Sign in with Twitch" }),
		).toBeEnabled();
	});
});
