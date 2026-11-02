import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search, ArrowUpRight } from "lucide-react";
import { Modal, Spinner, EmptyState, ErrorBox } from "@/components/ui";
import { allRecords } from "@/api/resources";
import { useWorkspace } from "@/stores/workspace";
import { labelFor } from "@/lib/format";
export function GlobalSearch({ onClose }: { onClose: () => void }) {
  const farm = useWorkspace((s) => s.farm?.id) || "";
  const [text, setText] = useState("");
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["farm", farm, "global-search"],
    queryFn: async () => {
      const sources = [
        ["events", "events"],
        ["blocks", "land"],
        ["assets", "assets"],
      ];
      const results = await Promise.allSettled(
        sources.map(async ([resource, feature]) => ({
          resource,
          feature,
          ...(await allRecords(farm, resource)),
        })),
      );
      if (results.every((r) => r.status === "rejected"))
        throw (results[0] as PromiseRejectedResult).reason;
      return {
        rows: results.flatMap((r) =>
          r.status === "fulfilled"
            ? r.value.rows.map((row) => ({
                ...row,
                resource: r.value.resource,
                feature: r.value.feature,
              }))
            : [],
        ),
        partial: results.some((r) => r.status === "rejected"),
      };
    },
  });
  const matches =
    q.data?.rows
      .filter((r) => labelFor(r).toLowerCase().includes(text.toLowerCase()))
      .slice(0, 15) || [];
  return (
    <Modal title="Find something on your farm" onClose={onClose}>
      <div className="search-input mb-4">
        <Search size={18} />
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="A block, asset or piece of work…"
          aria-label="Search farm records"
        />
      </div>
      {q.data?.partial && (
        <p className="field-help mb-3">
          Some sections were unavailable. Results include only the sections that
          loaded.
        </p>
      )}
      {q.isLoading ? (
        <Spinner />
      ) : q.isError ? (
        <ErrorBox error={q.error} retry={() => q.refetch()} />
      ) : !text ? (
        <p className="muted p-4">
          Start typing to search the records you can access.
        </p>
      ) : matches.length ? (
        <div className="search-results">
          {matches.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                navigate(`/${r.feature}?tab=${r.resource}&record=${r.id}`);
                onClose();
              }}
            >
              <div>
                <strong>{labelFor(r)}</strong>
                <small>{r.resource}</small>
              </div>
              <ArrowUpRight size={17} />
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No matches"
          description="Try a shorter name. Only records available to your membership appear here."
        />
      )}
    </Modal>
  );
}
