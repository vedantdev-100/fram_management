import { ModuleWorkspace } from "@/components/workspace/ModuleWorkspace";
import { resources } from "../components/resources";
import { commands } from "../components/commands";
import { useModule } from "../hooks/useModule";
import { api } from "../api";
export default function Page() {
  return (
    <ModuleWorkspace
      title="Team & settings"
      description="Farm preferences, members and access"
      feature="settings"
      resources={resources}
      commands={commands}
      api={api}
      useRecords={useModule}
    />
  );
}
