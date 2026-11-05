import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useFarms } from "../hooks/useFarms";
import { useWorkspace } from "@/stores/workspace";
import { useSession } from "@/stores/session";
import { queryClient } from "@/api/queryClient";
import { usePermissions } from "@/hooks/usePermissions";
import { Spinner, ErrorBox, Button } from "@/components/ui";
import { FarmForm } from "../components/FarmForm";
import { JoinFarmForm } from "../components/JoinFarmForm";
export function FarmGate({ children }: { children: ReactNode }) {
  const q = useFarms();
  const access = usePermissions();
  const farm = useWorkspace((s) => s.farm);
  const setFarm = useWorkspace((s) => s.setFarm);
  const [intent, setIntent] = useState<"choose" | "join" | "create">("choose");
  useEffect(() => {
    if (q.data) {
      const selected = q.data.find((f) => f.id === farm?.id);
      if (selected && JSON.stringify(selected) !== JSON.stringify(farm))
        setFarm(selected);
      else if (!selected) setFarm(q.data[0] || null);
    }
  }, [q.data, farm, setFarm]);
  if (q.isLoading) return <Spinner label="Opening your farm…" />;
  if (q.isError && !q.data)
    return (
      <div className="standalone">
        <ErrorBox error={q.error} retry={() => q.refetch()} />
      </div>
    );
  if (q.data?.length && (!farm || !q.data.some((f) => f.id === farm.id)))
    return <Spinner label="Selecting your farm…" />;
  if (!farm || !q.data?.some((f) => f.id === farm.id))
    return (
      <main className="standalone">
        <section className="panel onboarding-panel">
          <div className="eyebrow">YOUR FARM WORKSPACE</div>
          <h1>
            {intent === "join"
              ? "Join your farm team"
              : intent === "create"
                ? "Create your own farm"
                : "How would you like to get started?"}
          </h1>
          {intent === "choose" ? (
            <>
              <p>
                Invited workers join an existing farm. You do not need to create
                a farm to work with your team.
              </p>
              <div className="onboarding-options">
                <Button onClick={() => setIntent("join")}>
                  I have an invitation
                </Button>
                <Button variant="secondary" onClick={() => setIntent("create")}>
                  I want to create my own farm
                </Button>
              </div>
            </>
          ) : intent === "join" ? (
            <JoinFarmForm />
          ) : (
            <FarmForm />
          )}
          <div className="form-footer">
            {intent !== "choose" && (
              <Button variant="ghost" onClick={() => setIntent("choose")}>
                Back to choices
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                queryClient.clear();
                setFarm(null);
                useSession.getState().clear();
              }}
            >
              Sign out
            </Button>
          </div>
        </section>
      </main>
    );
  if (access.isLoading) return <Spinner label="Checking your farm access…" />;
  if (access.error && !access.data)
    return (
      <div className="standalone">
        <div>
          <ErrorBox error={access.error} retry={() => access.refetch()} />
          <p className="field-help">
            This frontend requires the updated farm access endpoint. Install the
            backend changes before using role-aware navigation.
          </p>
        </div>
      </div>
    );
  return children;
}
