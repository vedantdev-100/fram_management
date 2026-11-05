import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { useSession } from "@/stores/session";
import AuthPage from "./AuthPage";
const spies = vi.hoisted(() => ({ register: vi.fn(), login: vi.fn() }));
vi.mock("../hooks/useAuth", () => ({
  useRegister: () => ({ mutateAsync: spies.register, isPending: false }),
  useLogin: () => ({ mutateAsync: spies.login, isPending: false }),
  startDemo: vi.fn(),
}));
beforeEach(() => {
  useSession.setState({ user: null });
  spies.register.mockReset().mockResolvedValue({});
  spies.login.mockReset();
});
afterEach(cleanup);
async function fill(input: HTMLElement, value: string) {
  const user = userEvent.setup();
  await user.click(input);
  await user.paste(value);
}
async function signup() {
  render(
    <MemoryRouter>
      <AuthPage />
    </MemoryRouter>,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Create an account" }),
  );
  await fill(screen.getByLabelText("Full name"), "Farm worker");
  await fill(screen.getByLabelText("Email address"), "Worker@Example.com");
  await fill(screen.getByLabelText(/^Password/), "FieldWork-Blue-Sky-39!");
  await fill(
    screen.getByLabelText("Confirm password"),
    "FieldWork-Blue-Sky-39!",
  );
}
describe("invited worker registration", () => {
  it("requires an invitation for joining and submits the invited email without a client role", async () => {
    await signup();
    expect(screen.getByRole("radio", { name: /Join a farm/ })).toBeChecked();
    expect(screen.getByLabelText(/^Invitation code/)).toBeRequired();
    await fill(
      screen.getByLabelText(/^Invitation code/),
      "test-invitation-code",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Create account & join farm" }),
    );
    expect(spies.register).toHaveBeenCalledWith({
      email: "worker@example.com",
      full_name: "Farm worker",
      password: "FieldWork-Blue-Sky-39!",
      account_mode: "invited",
      invitation_code: "test-invitation-code",
    });
    expect(spies.login).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        /Your account was created and the farm invitation accepted/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });
  it("keeps an explicit separate owner path without an invitation", async () => {
    await signup();
    await userEvent.click(
      screen.getByRole("radio", { name: /Create my own farm/ }),
    );
    expect(screen.queryByLabelText(/^Invitation code/)).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Create account" }),
    );
    expect(spies.register).toHaveBeenCalledWith(
      expect.objectContaining({ account_mode: "owner" }),
    );
    expect(spies.register.mock.calls[0][0]).not.toHaveProperty(
      "invitation_code",
    );
  });
  it("keeps the form open when the invitation is rejected", async () => {
    spies.register.mockRejectedValueOnce(new Error("Invitation is expired"));
    await signup();
    await fill(screen.getByLabelText(/^Invitation code/), "expired");
    await userEvent.click(
      screen.getByRole("button", { name: "Create account & join farm" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Invitation is expired",
    );
    expect(screen.getByLabelText(/^Invitation code/)).toHaveValue("expired");
    expect(spies.login).not.toHaveBeenCalled();
  });
});
