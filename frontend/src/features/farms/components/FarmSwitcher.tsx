import { useState } from "react";
import { Plus } from "lucide-react";
import { useFarms } from "../hooks/useFarms";
import { useWorkspace } from "@/stores/workspace";
import { queryClient } from "@/api/queryClient";
import { Modal } from "@/components/ui";
import { FarmForm } from "./FarmForm";
export function FarmSwitcher() {
  const q = useFarms();
  const farm = useWorkspace((s) => s.farm);
  const [create, setCreate] = useState(false);
  return (
    <>
      <div className="farm-switcher">
        <span className="farm-initial">{farm?.name.slice(0, 1) || "F"}</span>
        <div>
          <span className="farm-switcher-label">WORKSPACE</span>
          <select
            aria-label="Switch farm"
            value={farm?.id || ""}
            onChange={(e) => {
              const f = q.data?.find((f) => f.id === e.target.value);
              if (f) {
                queryClient.removeQueries({ queryKey: ["farm"] });
                useWorkspace.getState().setFarm(f);
              }
            }}
          >
            {q.data?.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <button
          className="icon-button"
          aria-label="Create another farm"
          onClick={() => setCreate(true)}
        >
          <Plus size={16} />
        </button>
      </div>
      {create && (
        <Modal title="Create another farm" onClose={() => setCreate(false)}>
          <FarmForm onDone={() => setCreate(false)} />
        </Modal>
      )}
    </>
  );
}
