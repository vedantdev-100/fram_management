// Permission codes mirror backend command decorators; the server remains authoritative.
export const commandPermissions: Record<string, string> = {
  ledger_transfer: "ledger.entry.create",
  record_payment: "ledger.entry.create",
  generate_loan_schedule: "ledger.entry.manage",
  set_role_permissions: "identity.role.manage",
  create_role: "identity.role.manage",
  update_farm: "identity.farm.update",
  create_category: "events.type.manage",
  duplicate_event: "events.event.plan",
  set_execution: "events.event.submit",
  archive_scenario: "workbench.scenario.update",
  create_event: "events.event.plan",
  plan_event: "events.event.plan",
  start_event: "events.event.start",
  cancel_event: "events.event.cancel",
  reschedule_event: "events.event.reschedule",
  submit_event: "events.event.submit",
  confirm_event: "events.event.confirm",
  amend_event: "events.event.amend",
  record_observation: "events.observation.create",
  adjust_stock: "events.stock.adjust",
  save_type: "events.type.manage",
  create_crop_cycle: "land.cycle.create",
  attach_blocks: "land.cycle.update",
  close_cycle: "land.cycle.close",
  set_boundary: "land.block.edit_boundary",
  split_block: "land.block.edit_boundary",
  generate_calendar: "cropscience.science.manage",
  record_stage: "cropscience.science.manage",
  recompute_gdd: "cropscience.science.manage",
  decide_suggestion: "cropscience.science.manage",
  change_depreciation_policy: "costing.depreciation.manage",
  run_reconciliation: "costing.cost.manage",
  compute_metrics: "workbench.scenario.compute",
  adopt_scenario: "workbench.scenario.adopt",
  invite: "identity.invitation.create",
  remove_member: "identity.member.manage",
  change_member: "identity.member.manage",
  preview_boundary: "land.block.edit_boundary",
  mark_notification_read: "notifications.notification.view",
};
export const resourcePrefixes: Record<string, string> = {
  identity: "identity.member",
  catalogue: "catalogue.catalogue",
  land: "land.land",
  assets: "assets.asset",
  scheduling: "scheduling.schedule",
  events: "events.event",
  cropscience: "cropscience.science",
  ledger: "ledger.entry",
  costing: "costing.cost",
  compliance: "compliance.compliance",
  workbench: "workbench.scenario",
  files: "files.attachment",
  notifications: "notifications.notification",
  audit: "audit.log",
};
export const pagePermissions: Record<string, string | null> = {
  "/": null,
  "/land": "land.land.view",
  "/assets": "assets.asset.view",
  "/events": "events.event.view",
  "/ledger": "ledger.entry.view",
  "/reports": "reporting.report.view",
  "/crop-science": "cropscience.science.view",
  "/scheduling": "scheduling.schedule.view",
  "/workbench": "workbench.scenario.view",
  "/costing": "costing.cost.view",
  "/compliance": "compliance.compliance.view",
  "/files": "files.attachment.view",
  "/catalogue": "catalogue.catalogue.view",
  "/settings": "identity.member.view",
  "/audit": "audit.log.view",
  "/notifications": "notifications.notification.view",
  "/sync": null,
};
export function permissionChecks(permissions: string[], preview = false) {
  const allowed = new Set(permissions);
  const has = (code: string) => preview || allowed.has(code);
  const canCommand = (key: string) =>
    key === "duplicate_configuration"
      ? preview ||
        Object.values(resourcePrefixes).some((prefix) =>
          has(prefix + ".create"),
        )
      : !!commandPermissions[key] && has(commandPermissions[key]);
  const canPage = (path: string) => {
    const key = path.replace(/\/$/, "") || "/";
    return (
      key in pagePermissions &&
      (pagePermissions[key] === null || has(pagePermissions[key]!))
    );
  };
  const resourcePermission = (
    model: string,
    action: "create" | "update" | "view",
  ) => {
    const prefix = resourcePrefixes[model.split(".")[0]];
    return !!prefix && has(prefix + "." + action);
  };
  return { has, canCommand, canPage, resourcePermission };
}
