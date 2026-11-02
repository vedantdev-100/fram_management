import { EventDetail } from "../components/EventDetail";
import { ModuleWorkspace } from "@/components/workspace/ModuleWorkspace";
import { resources } from "../components/resources";
import { commands } from "../components/commands";
import { useModule } from "../hooks/useModule";
import { api } from "../api";
export default function Page() {
  return (
    <ModuleWorkspace
      title="Farm work"
      description="Plan the work. Record what happened."
      feature="events"
      resources={resources}
      commands={commands}
      api={api}
      useRecords={useModule}
      renderDetail={(row, resource) =>
        resource === "events" ? <EventDetail record={row} /> : undefined
      }
    />
  );
}
