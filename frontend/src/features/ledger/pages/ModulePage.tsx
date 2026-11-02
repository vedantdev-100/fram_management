import { ModuleWorkspace } from "@/components/workspace/ModuleWorkspace";
import { resources } from "../components/resources";
import { commands } from "../components/commands";
import { useModule } from "../hooks/useModule";
import { api } from "../api";
export default function Page() {
  return (
    <ModuleWorkspace
      title="Money"
      description="Cash movements, accounts and credit"
      feature="ledger"
      resources={resources}
      commands={commands}
      api={api}
      useRecords={useModule}
    />
  );
}
