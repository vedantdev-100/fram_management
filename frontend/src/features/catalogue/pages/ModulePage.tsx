import { ModuleWorkspace } from "@/components/workspace/ModuleWorkspace";
import { resources } from "../components/resources";
import { commands } from "../components/commands";
import { useModule } from "../hooks/useModule";
import { api } from "../api";
export default function Page() {
  return (
    <ModuleWorkspace
      title="Farm catalogue"
      description="Crops, products, units and your contacts"
      feature="catalogue"
      resources={resources}
      commands={commands}
      api={api}
      useRecords={useModule}
    />
  );
}
