import { ModuleWorkspace } from "@/components/workspace/ModuleWorkspace";
import { resources } from "../components/resources";
import { commands } from "../components/commands";
import { useModule } from "../hooks/useModule";
import { api } from "../api";
export default function Page() {
  return (
    <ModuleWorkspace
      title="Crop plans"
      description="Calendars, stages and field observations"
      feature="crop-science"
      resources={resources}
      commands={commands}
      api={api}
      useRecords={useModule}
    />
  );
}
