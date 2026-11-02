import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button, ErrorBox } from "@/components/ui";
import { syncApi } from "../api";
import { useWorkspace } from "@/stores/workspace";
import { refreshFarmQueries } from "@/api/queryClient";
export function BatchUpload() {
  const farm = useWorkspace((s) => s.farm)!;
  const [events, setEvents] = useState<unknown[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const mutation = useMutation({
    mutationFn: () => syncApi.batch(farm.id, events!),
    onSuccess: () => refreshFarmQueries(),
  });
  return (
    <section className="panel p-6">
      <h2 className="section-heading">Submit an offline event batch</h2>
      <p className="form-intro">
        Import a JSON file containing an events array. Up to 50 event payloads,
        each with its original client UUID. This sends explicit saved events; it
        does not queue ordinary form edits while offline.
      </p>
      <label className="field">
        Saved batch
        <input
          type="file"
          accept="application/json,.json"
          onChange={async (e) => {
            setError(null);
            setEvents(null);
            try {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 1024 * 1024)
                throw new Error("Batch file exceeds 1 MB.");
              const data = JSON.parse(await file.text());
              const items = Array.isArray(data) ? data : data.events;
              if (!Array.isArray(items) || !items.length || items.length > 50)
                throw new Error("Choose a batch of 1–50 events.");
              setEvents(items);
            } catch (e) {
              setError(e);
            }
          }}
        />
      </label>
      <Button
        disabled={!events}
        loading={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        Submit {events?.length || ""} saved events
      </Button>
      {Boolean(error || mutation.error) && (
        <ErrorBox error={error || mutation.error} />
      )}
      <div className="mt-4 space-y-2">
        {mutation.data?.results.map((r, i) => (
          <p
            key={i}
            className={r.status === "accepted" ? "success-note" : "field-error"}
          >
            {r.client_uuid}: {r.status}
            {r.error ? " · " + r.error : ""}
          </p>
        ))}
      </div>
    </section>
  );
}
