import { useState } from "react";
import { Button, ErrorBox } from "@/components/ui";
import { useCreateFarm } from "../hooks/useFarms";
export function FarmForm({ onDone }: { onDone?: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [region, setRegion] = useState("");
  const mutation = useCreateFarm();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate(
          {
            name,
            slug,
            region,
            country: "IN",
            timezone: "Asia/Kolkata",
            currency_code: "INR",
          },
          { onSuccess: onDone },
        );
      }}
    >
      <label className="field">
        Farm name
        <input
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSlug(
              e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, ""),
            );
          }}
          placeholder="e.g. Umred Farm"
        />
      </label>
      <label className="field">
        Unique farm handle
        <input
          required
          pattern="[-a-zA-Z0-9_]+"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <small className="field-help">
          A unique short name for this workspace.
        </small>
      </label>
      <label className="field">
        Region
        <input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="e.g. Umred, Nagpur"
        />
      </label>
      <p className="field-help mb-5">
        Starts with INR and Asia/Kolkata. The farm owner can update these
        preferences later.
      </p>
      {mutation.error && <ErrorBox error={mutation.error} />}
      <Button type="submit" loading={mutation.isPending}>
        Create farm workspace
      </Button>
    </form>
  );
}
