import { useEffect } from "react";
import type { ReactNode } from "react";
import { useFarms } from "../hooks/useFarms";
import { useWorkspace } from "@/stores/workspace";
import { Spinner, ErrorBox } from "@/components/ui";
import { FarmForm } from "../components/FarmForm";
export function FarmGate({ children }: { children: ReactNode }) {
  const q = useFarms();
  const farm = useWorkspace((s) => s.farm);
  const setFarm = useWorkspace((s) => s.setFarm);
  useEffect(() => {
    if (q.data) {
      const selected = q.data.find((f) => f.id === farm?.id);
      if (selected && JSON.stringify(selected) !== JSON.stringify(farm))
        setFarm(selected);
      else if (!selected) setFarm(q.data[0] || null);
    }
  }, [q.data, farm, setFarm]);
  if (q.isLoading) return <Spinner label="Opening your farm…" />;
  if (q.isError)
    return (
      <div className="standalone">
        <ErrorBox error={q.error} retry={() => q.refetch()} />
      </div>
    );
  if (!farm || !q.data?.some((f) => f.id === farm.id))
    return (
      <main className="standalone">
        <section className="panel p-8 max-w-lg w-full">
          <div className="eyebrow mb-3">A PLACE FOR YOUR FARM</div>
          <h1 className="text-3xl font-semibold mb-3">Let’s get you set up.</h1>
          <p className="muted mb-6">
            Create your first farm. Blocks, people and crop cycles come next.
          </p>
          <FarmForm />
        </section>
      </main>
    );
  return children;
}
