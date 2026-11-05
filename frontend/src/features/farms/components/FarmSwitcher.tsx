import { usePermissions } from "@/hooks/usePermissions";
import { JoinFarmForm } from "./JoinFarmForm";
import { useEffect, useRef, useState } from "react";
import {
  Plus,
  ChevronDown,
  Check,
  Search,
  Sprout,
  ArrowRight,
} from "lucide-react";
import { useFarms } from "../hooks/useFarms";
import { useWorkspace } from "@/stores/workspace";
import { queryClient } from "@/api/queryClient";
import { Modal } from "@/components/ui";
import { FarmForm } from "./FarmForm";
import type { Farm } from "@/types";
export function FarmSwitcher() {
  const q = useFarms();
  const access = usePermissions();
  const [join, setJoin] = useState(false);
  const farm = useWorkspace((s) => s.farm);
  const [create, setCreate] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const farms = q.data || (farm ? [farm] : []);
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape, true);
    };
  }, [open]);
  const choose = (next: Farm) => {
    if (next.id !== farm?.id) {
      queryClient.removeQueries({ queryKey: ["farm"] });
      useWorkspace.getState().setFarm(next);
    }
    useWorkspace.getState().setSidebar(false);
    setOpen(false);
    setSearch("");
    trigger.current?.focus();
  };
  return (
    <>
      <div
        className="workspace-picker"
        ref={root}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node))
            setOpen(false);
        }}
      >
        <button
          ref={trigger}
          className="workspace-trigger"
          aria-label={`Switch farm: ${farm?.name || "Choose a farm"}`}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => {
            setSearch("");
            setOpen(!open);
          }}
        >
          <span className="workspace-mark" aria-hidden="true">
            <Sprout size={20} />
          </span>
          <span className="workspace-identity">
            <span>Your workspace</span>
            <strong title={farm?.name}>{farm?.name || "Choose a farm"}</strong>
            <small>Switch or create a farm</small>
          </span>
          <ChevronDown
            size={16}
            className={open ? "workspace-chevron is-open" : "workspace-chevron"}
          />
        </button>
        {open && (
          <div
            className="workspace-dropdown"
            role="dialog"
            aria-label="Choose farm workspace"
          >
            <header>
              <strong>Farm workspaces</strong>
              <span>{farms.length} available</span>
            </header>
            <div className="workspace-search">
              <Search size={15} />
              <input
                ref={input}
                aria-label="Find a farm"
                placeholder="Find a farm…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="workspace-options">
              {farms
                .filter((f) =>
                  f.name.toLowerCase().includes(search.toLowerCase()),
                )
                .map((f) => (
                  <button
                    className="workspace-option"
                    key={f.id}
                    aria-pressed={farm?.id === f.id}
                    onClick={() => choose(f)}
                  >
                    <span className="workspace-option-initial">
                      {f.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span>
                      <strong>{f.name}</strong>
                      <small>
                        {farm?.id === f.id
                          ? "Current workspace"
                          : "Open workspace"}
                      </small>
                    </span>
                    {farm?.id === f.id ? (
                      <Check size={16} />
                    ) : (
                      <ArrowRight size={15} />
                    )}
                  </button>
                ))}
              {q.isLoading && (
                <p className="workspace-picker-note">Loading your farms…</p>
              )}
              {q.isError && (
                <p className="workspace-picker-note">
                  Could not load farms.{" "}
                  <button className="text-link" onClick={() => q.refetch()}>
                    Retry
                  </button>
                </p>
              )}
              {!q.isLoading &&
                !q.isError &&
                !farms.some((f) =>
                  f.name.toLowerCase().includes(search.toLowerCase()),
                ) && (
                  <p className="workspace-picker-note">
                    No farms match your search.
                  </p>
                )}
            </div>
            <button
              className="workspace-create"
              onClick={() => {
                setOpen(false);
                setJoin(true);
              }}
            >
              <Plus size={17} />
              <span>Join with an invitation</span>
            </button>
            {access.has("identity.farm.create") && (
              <>
                {" "}
                <button
                  className="workspace-create"
                  onClick={() => {
                    setOpen(false);
                    setCreate(true);
                  }}
                >
                  <Plus size={17} />
                  <span>Create another farm</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {join && (
        <Modal title="Join another farm" onClose={() => setJoin(false)}>
          <JoinFarmForm onDone={() => setJoin(false)} />
        </Modal>
      )}
      {create && (
        <Modal title="Create another farm" onClose={() => setCreate(false)}>
          <FarmForm
            onDone={() => {
              setCreate(false);
              trigger.current?.focus();
            }}
          />
        </Modal>
      )}
    </>
  );
}
