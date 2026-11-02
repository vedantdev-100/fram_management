import { BoundaryTools } from "../components/BoundaryTools";
import { ModuleWorkspace } from "@/components/workspace/ModuleWorkspace";
import { resources } from "../components/resources";
import { commands } from "../components/commands";
import { useModule } from "../hooks/useModule";
import { api } from "../api";
export default function Page() {
  return (
    <ModuleWorkspace
      title="Field plan"
      description="Blocks, boundaries and crop cycles"
      feature="land"
      resources={resources}
      commands={commands}
      api={api}
      useRecords={useModule}
      toolbar={<BoundaryTools />}
    />
  );
}
