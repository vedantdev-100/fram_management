import { describe, it, expect } from "vitest";
import { permissionChecks } from "./permissions";
describe("farm capabilities", () => {
  const worker = permissionChecks([
    "land.land.view",
    "assets.asset.view",
    "events.event.view",
    "events.event.start",
    "events.event.submit",
    "events.observation.create",
    "files.attachment.create",
  ]);
  it("lets workers view their dashboard/work without exposing administration", () => {
    expect(worker.canPage("/")).toBe(true);
    expect(worker.canPage("/events")).toBe(true);
    expect(worker.canPage("/settings")).toBe(false);
    expect(worker.has("identity.farm.create")).toBe(false);
    expect(worker.resourcePermission("land.Block", "create")).toBe(false);
  });
  it("separates starting/submitting work from planning and confirmation", () => {
    expect(worker.canCommand("start_event")).toBe(true);
    expect(worker.canCommand("submit_event")).toBe(true);
    expect(worker.canCommand("record_observation")).toBe(true);
    expect(worker.canCommand("create_event")).toBe(false);
    expect(worker.canCommand("confirm_event")).toBe(false);
    expect(worker.canCommand("set_role_permissions")).toBe(false);
    expect(worker.canCommand("invented_command")).toBe(false);
  });
  it("uses capabilities rather than a role name and fails closed before access loads", () => {
    const custom = permissionChecks([
      "identity.role.manage",
      "identity.member.view",
    ]);
    expect(custom.canCommand("create_role")).toBe(true);
    expect(custom.canPage("/settings")).toBe(true);
    expect(custom.canCommand("invite")).toBe(false);
    expect(permissionChecks([]).canCommand("confirm_event")).toBe(false);
    expect(permissionChecks([]).canPage("/unknown")).toBe(false);
  });
});
