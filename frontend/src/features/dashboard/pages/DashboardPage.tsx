import { usePermissions } from "@/hooks/usePermissions";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Map,
  ClipboardList,
  Package,
  Flower2,
  Sun,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { useSession } from "@/stores/session";
import { useWorkspace } from "@/stores/workspace";
import { useOverview } from "../hooks/useOverview";
import {
  PageHeader,
  Panel,
  Badge,
  Spinner,
  ErrorBox,
  EmptyState,
} from "@/components/ui";
import { FieldDiagram } from "../components/FieldDiagram";
import { number, shortDate } from "@/lib/format";
export default function DashboardPage() {
  const access = usePermissions();
  const user = useSession((s) => s.user);
  const farm = useWorkspace((s) => s.farm);
  const query = useOverview();
  const [queue, setQueue] = useState<"upcoming" | "review">("upcoming");
  if (query.isLoading) return <Spinner />;
  if (query.isError)
    return <ErrorBox error={query.error} retry={() => query.refetch()} />;
  const data = query.data!;
  const leafBlocks = data.blocks.filter(
    (b) => !data.blocks.some((child) => child.parent === b.id),
  );
  const activeCycles = data.cycles.filter((c) =>
    ["active", "harvesting"].includes(String(c.status)),
  );
  const open = data.events.filter((e) =>
    ["planned", "in_progress"].includes(String(e.status)),
  );
  const review = open.filter(
    (e) =>
      e.submitted_at || new Date(String(e.planned_end)).getTime() < Date.now(),
  );
  const low = data.stock.filter(
    (s) => Number(s.on_hand_qty) <= Number(s.reorder_level),
  );
  const work = (queue === "review" ? review : open)
    .sort((a, b) =>
      String(a.planned_start).localeCompare(String(b.planned_start)),
    )
    .slice(0, 5);
  const date = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: farm?.timezone || "Asia/Kolkata",
  }).format(new Date());
  const stats = [
    {
      label: "Active crop cycles",
      value: data.unavailable.includes("crop-cycles")
        ? "—"
        : activeCycles.length,
      note: `${data.cycles.length} across your farm`,
      icon: Flower2,
      style: "green",
    },
    {
      label: "Work to complete",
      value: data.unavailable.includes("events") ? "—" : open.length,
      note: `${review.length} ready for review`,
      icon: ClipboardList,
      style: "blue",
    },
    {
      label: "Land under care",
      value: data.unavailable.includes("blocks")
        ? "—"
        : number(
            leafBlocks
              .filter((b) => b.status !== "retired")
              .reduce((n, b) => n + Number(b.area_m2 || 0), 0) / 4046.8564,
          ),
      note: `Acres · ${data.blocks.length} recorded blocks`,
      icon: Map,
      style: "ochre",
    },
    {
      label: "Stock to check",
      value: data.unavailable.includes("stock-items") ? "—" : low.length,
      note: low.length
        ? "At or below reorder level"
        : "No low-stock items in view",
      icon: Package,
      style: "rose",
    },
  ];
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow={date.toUpperCase()}
        title={`Good to see you, ${user?.full_name.split(" ")[0] || "there"}.`}
        description="Here’s how things are looking on your farm."
        actions={
          access.has("events.event.plan") ? (
            <Link
              className="button button-primary"
              to="/events?tab=events&action=create_event"
            >
              <Plus size={17} />
              Plan work
            </Link>
          ) : undefined
        }
      />
      <div className="overview-note">
        <span className="overview-note-icon">
          <Sun size={21} />
        </span>
        <div>
          <strong>A little planning goes a long way.</strong>
          <span>
            {review.length
              ? `${review.length} ${review.length === 1 ? "operation needs" : "operations need"} a review before the records are complete.`
              : "Your next operations and crop cycles, all in one place."}
          </span>
        </div>
        <Link to="/events">
          See farm work
          <ArrowRight size={16} />
        </Link>
      </div>
      {data.unavailable.length > 0 && (
        <div className="error-box" role="status">
          Some sections could not be loaded: {data.unavailable.join(", ")}.
          Check your membership access or refresh the workspace.
        </div>
      )}
      <div className="stats-grid">
        {stats.map((s) => (
          <section className="stat-card" key={s.label}>
            <div className="stat-label">
              {s.label}
              <span className={"stat-icon " + s.style}>
                <s.icon size={18} />
              </span>
            </div>
            <strong>
              {s.value}
              {data.truncated && "+"}
            </strong>
            <small>{s.note}</small>
          </section>
        ))}
      </div>
      {data.truncated && (
        <p className="below-table-note">
          Overview is based on the first 2,500 records in each section.
        </p>
      )}
      <div className="dashboard-grid">
        <Panel
          title="The work ahead"
          subtitle="One operation at a time."
          action={
            <Link className="text-link" to="/events">
              View all
              <ArrowUpRight size={14} />
            </Link>
          }
        >
          <div className="queue-tabs">
            <button
              className={queue === "upcoming" ? "active" : ""}
              onClick={() => setQueue("upcoming")}
            >
              Upcoming <span>{open.length}</span>
            </button>
            <button
              className={queue === "review" ? "active" : ""}
              onClick={() => setQueue("review")}
            >
              Needs review <span>{review.length}</span>
            </button>
          </div>
          {work.length ? (
            <div className="work-list">
              {work.map((e) => (
                <Link
                  className="work-row"
                  key={e.id}
                  to={`/events?tab=events&record=${e.id}`}
                >
                  <div className="date-tile">
                    <strong>
                      {new Date(String(e.planned_start)).getDate()}
                    </strong>
                    <small>
                      {new Date(String(e.planned_start)).toLocaleString(
                        "en-IN",
                        { month: "short" },
                      )}
                    </small>
                  </div>
                  <div className="work-row-title">
                    <strong>{String(e.title)}</strong>
                    <small>
                      {e.submitted_at
                        ? "Actuals submitted · awaiting confirmation"
                        : e.status === "in_progress"
                          ? "Work has started"
                          : "Planned operation"}
                    </small>
                  </div>
                  <Badge value={e.status} />
                  <ChevronRight size={17} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                queue === "review"
                  ? "Nothing waiting for review"
                  : "A clear work list"
              }
              description="Plan the next operation when you’re ready."
            />
          )}
          {access.has("events.event.plan") && (
            <div className="panel-bottom-link">
              <Link to="/events?tab=events&action=create_event">
                <Plus size={16} />
                Plan another operation
              </Link>
            </div>
          )}
        </Panel>
        <Panel
          title="Your fields"
          subtitle={String(farm?.region || farm?.name || "Farm blocks")}
          action={
            <Link className="text-link" to="/land">
              Open field plan
              <ArrowUpRight size={14} />
            </Link>
          }
        >
          {data.blocks.length ? (
            <FieldDiagram blocks={leafBlocks} />
          ) : (
            <EmptyState
              title="Start with your land"
              description="Add a block to begin organising crop cycles."
              action={
                <Link className="button button-secondary" to="/land">
                  Add a block
                </Link>
              }
            />
          )}
        </Panel>
      </div>
      <div className="dashboard-lower">
        <Panel
          title="Growing this season"
          subtitle="Keep a simple view of each enterprise."
          action={
            <Link className="text-link" to="/land?tab=crop-cycles">
              All crop cycles
              <ArrowUpRight size={14} />
            </Link>
          }
        >
          {data.cycles.length ? (
            <div className="cycle-list">
              {data.cycles.slice(0, 3).map((c, i) => (
                <Link
                  className="cycle-row"
                  to={`/land?tab=crop-cycles&record=${c.id}`}
                  key={c.id}
                >
                  <span className={"crop-mark crop-" + i}>
                    <Flower2 size={22} />
                  </span>
                  <div>
                    <strong>{String(c.name)}</strong>
                    <small>
                      {shortDate(c.planned_sowing_date)} —{" "}
                      {shortDate(c.expected_harvest_end)}
                    </small>
                  </div>
                  <Badge value={c.status} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Make a plan for the season"
              description="A crop cycle connects your land, work, costs and harvest."
            />
          )}
        </Panel>
        <Panel
          title="Worth a look"
          subtitle="Small things that keep the farm moving."
        >
          <div className="attention-list">
            <Link to="/assets?tab=stock-items">
              <span className="attention-icon amber">
                <Package size={18} />
              </span>
              <div>
                <strong>
                  {low.length
                    ? `${low.length} stock items need a check`
                    : "Stock levels look steady"}
                </strong>
                <small>Review quantities and reorder levels</small>
              </div>
              <ChevronRight size={16} />
            </Link>
            <Link to="/events">
              <span className="attention-icon green">
                <CheckCircle2 size={18} />
              </span>
              <div>
                <strong>
                  {review.length
                    ? `${review.length} operations await review`
                    : "Your work records are up to date"}
                </strong>
                <small>Confirm actuals to complete the record</small>
              </div>
              <ChevronRight size={16} />
            </Link>
            <Link to="/compliance">
              <span className="attention-icon blue">
                <AlertTriangle size={18} />
              </span>
              <div>
                <strong>Check field restrictions</strong>
                <small>Review waiting and re-entry periods</small>
              </div>
              <ChevronRight size={16} />
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
