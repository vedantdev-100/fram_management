import type { ResourceDefinition } from "@/types";
export const resources: ResourceDefinition[] = [
  {
    key: "attachments",
    title: "Attachments",
    model: "files.Attachment",
    editable: false,
    versioned: false,
    columns: ["original_name", "kind", "size", "created_at"],
    fields: [
      {
        name: "file",
        label: "File",
        required: false,
        type: "text",
      },
      {
        name: "original_name",
        label: "Original name",
        required: false,
        type: "text",
      },
      {
        name: "content_type",
        label: "Content type",
        required: false,
        type: "text",
      },
      {
        name: "size",
        label: "Size",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "kind",
        label: "Kind",
        required: false,
        type: "select",
        options: [
          {
            value: "photo",
            label: "Photo",
          },
          {
            value: "bill",
            label: "Bill",
          },
          {
            value: "certificate",
            label: "Certificate",
          },
          {
            value: "other",
            label: "Other",
          },
        ],
      },
      {
        name: "taken_at",
        label: "Taken at",
        required: false,
        type: "datetime-local",
      },
      {
        name: "geotag",
        label: "Geotag",
        required: false,
        type: "json",
        advanced: true,
      },
      {
        name: "target_type",
        label: "Target type",
        required: false,
        type: "text",
      },
      {
        name: "target_id",
        label: "Target id",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
      {
        name: "uploaded_by",
        label: "Uploaded by",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
    ],
    relations: {},
  },
];

resources
  .filter((r) => r.key === "events")
  .forEach((r) => {
    r.createCommand = "create_event";
  });

resources
  .filter((r) => r.key === "types")
  .forEach((r) => {
    r.createCommand = "save_type";
  });

resources
  .filter((r) => r.key === "categories")
  .forEach((r) => {
    r.createCommand = "create_category";
  });

resources
  .filter((r) => r.key === "observations")
  .forEach((r) => {
    r.createCommand = "record_observation";
  });

resources
  .filter((r) => r.key === "crop-cycles")
  .forEach((r) => {
    r.createCommand = "create_crop_cycle";
  });

resources
  .filter((r) => r.key === "stage-records")
  .forEach((r) => {
    r.createCommand = "record_stage";
  });

resources
  .filter((r) => r.key === "entries")
  .forEach((r) => {
    r.createCommand = "record_payment";
  });

resources
  .filter((r) => r.key === "invitations")
  .forEach((r) => {
    r.createCommand = "invite";
  });

resources
  .filter((r) => r.key === "roles")
  .forEach((r) => {
    r.createCommand = "create_role";
  });

resources
  .filter((r) => r.key === "depreciation-assignments")
  .forEach((r) => {
    r.createCommand = "change_depreciation_policy";
  });

for (const resource of resources) {
  for (const f of resource.fields) {
    if (["asset", "base_unit"].includes(f.name)) f.immutable = true;
  }
}
