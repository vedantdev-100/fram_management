import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FarmGate } from "./FarmGate";
import { useWorkspace } from "@/stores/workspace";
import { useSession } from "@/stores/session";
const state = vi.hoisted(() => ({
  farms: [] as {
    id: string;
    name: string;
    slug: string;
    currency_code: string;
    timezone: string;
  }[],
}));
vi.mock("../hooks/useFarms", () => ({
  useFarms: () => ({ data: state.farms, isLoading: false, isError: false }),
}));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    data: { role: { code: "worker" } },
    isLoading: false,
    error: null,
  }),
}));
beforeEach(() => {
  state.farms = [];
  useWorkspace.setState({ farm: null });
  useSession.setState({
    user: {
      id: "worker",
      email: "worker@example.com",
      full_name: "Worker",
      memberships: [],
    },
  });
});
afterEach(cleanup);
function view() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <FarmGate>
        <h1>Worker dashboard</h1>
      </FarmGate>
    </QueryClientProvider>,
  );
}
describe("farm onboarding gate", () => {
  it("does not force users with no membership into farm creation", async () => {
    view();
    expect(
      screen.getByRole("button", { name: "I have an invitation" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create farm workspace" }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "I have an invitation" }),
    );
    expect(screen.getByLabelText("Invitation code")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create farm workspace" }),
    ).not.toBeInTheDocument();
  });
  it("opens an active worker's farm directly instead of showing setup choices", () => {
    state.farms = [
      {
        id: "farm-a",
        name: "Assigned farm",
        slug: "assigned",
        currency_code: "INR",
        timezone: "Asia/Kolkata",
      },
    ];
    useWorkspace.setState({ farm: state.farms[0] });
    view();
    expect(
      screen.getByRole("heading", { name: "Worker dashboard" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "I have an invitation" }),
    ).not.toBeInTheDocument();
  });
});
