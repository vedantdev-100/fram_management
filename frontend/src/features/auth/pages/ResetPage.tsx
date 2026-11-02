import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api";
import { Button, ErrorBox } from "@/components/ui";
export default function ResetPage() {
  const [uid, setUid] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [done, setDone] = useState(false);
  return (
    <main className="standalone">
      <div className="panel p-8 max-w-md w-full">
        <h1 className="text-2xl font-semibold mb-3">Choose a new password</h1>
        {done ? (
          <p>
            Password changed.{" "}
            <Link className="text-link" to="/sign-in">
              Sign in
            </Link>
          </p>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await authApi.confirmReset({ uid, token, password });
                setDone(true);
              } catch (e) {
                setError(e);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="field">
              Account reset identifier
              <input
                required
                value={uid}
                onChange={(e) => setUid(e.target.value)}
              />
            </label>
            <label className="field">
              Reset token
              <input
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </label>
            <label className="field">
              New password
              <input
                type="password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error !== null && <ErrorBox error={error} />}
            <Button type="submit" loading={busy}>
              Change password
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
