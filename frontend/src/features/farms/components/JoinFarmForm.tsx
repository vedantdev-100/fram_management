import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { farmsApi } from "../api";
import { queryClient } from "@/api/queryClient";
import { useSession } from "@/stores/session";
import { useWorkspace } from "@/stores/workspace";
import { Button, ErrorBox } from "@/components/ui";
export function JoinFarmForm({ onDone }: { onDone?: () => void }) {
  const [token, setToken] = useState("");
  const acceptedFarm = useRef<string | null>(null);
  const email = useSession((s) => s.user?.email);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!acceptedFarm.current) {
        const accepted = await farmsApi.acceptInvitation(token.trim());
        acceptedFarm.current = accepted.farm_id;
      }
      const farms = await farmsApi.list();
      return { farms, farmId: acceptedFarm.current };
    },
    onSuccess: ({ farms, farmId }) => {
      queryClient.removeQueries({ queryKey: ["farm"] });
      queryClient.setQueryData(
        ["farms", useSession.getState().user?.id],
        farms,
      );
      useWorkspace
        .getState()
        .setFarm(farms.find((f) => f.id === farmId) || farms[0] || null);
      onDone?.();
    },
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <p className="form-intro">
        Join an existing farm as <strong>{email}</strong>. The invitation must
        match this email. Its assigned role determines your access; joining does
        not create a new farm.
      </p>
      <label className="field">
        Invitation code
        <input
          required
          maxLength={512}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          disabled={mutation.isPending || !!acceptedFarm.current}
        />
      </label>
      {mutation.error && <ErrorBox error={mutation.error} />}
      <Button type="submit" loading={mutation.isPending}>
        {acceptedFarm.current
          ? "Refresh farms & open workspace"
          : "Accept invitation & open farm"}
      </Button>
    </form>
  );
}
