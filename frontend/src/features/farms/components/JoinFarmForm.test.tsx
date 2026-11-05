import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/api/queryClient";
import { useSession } from "@/stores/session";
import { useWorkspace } from "@/stores/workspace";
import { JoinFarmForm } from "./JoinFarmForm";
const api = vi.hoisted(() => ({ acceptInvitation: vi.fn(), list: vi.fn() }));
vi.mock("../api", () => ({ farmsApi: api }));
const farm = { id: "assigned-farm", name: "Assigned farm" };
beforeEach(() => {
  queryClient.clear();
  useSession.setState({
    user: {
      id: "worker",
      email: "worker@example.com",
      full_name: "Worker",
      memberships: [],
    },
  });
  useWorkspace.setState({ farm: null });
  api.acceptInvitation.mockReset().mockResolvedValue({ farm_id: farm.id });
  api.list.mockReset().mockResolvedValue([farm]);
});
afterEach(cleanup);
async function open() {
  render(
    <QueryClientProvider client={queryClient}>
      <JoinFarmForm />
    </QueryClientProvider>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByLabelText("Invitation code"));
  await user.paste("a-single-use-token");
  await user.click(
    screen.getByRole("button", { name: "Accept invitation & open farm" }),
  );
  return user;
}
it("joins an existing account and selects the assigned farm", async () => {
  await open();
  await waitFor(() => expect(useWorkspace.getState().farm?.id).toBe(farm.id));
  expect(api.acceptInvitation).toHaveBeenCalledExactlyOnceWith(
    "a-single-use-token",
  );
  expect(queryClient.getQueryData(["farms", "worker"])).toEqual([farm]);
});
it("retries loading farms without reusing an already-consumed invitation", async () => {
  api.list.mockRejectedValueOnce(new Error("Connection interrupted"));
  const user = await open();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Connection interrupted",
  );
  await user.click(
    screen.getByRole("button", { name: "Refresh farms & open workspace" }),
  );
  await waitFor(() => expect(useWorkspace.getState().farm?.id).toBe(farm.id));
  expect(api.acceptInvitation).toHaveBeenCalledTimes(1);
  expect(api.list).toHaveBeenCalledTimes(2);
});
