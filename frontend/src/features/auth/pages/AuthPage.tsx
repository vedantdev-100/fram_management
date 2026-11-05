import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, Eye, EyeOff } from "lucide-react";
import { useSession } from "@/stores/session";
import { Button, ErrorBox } from "@/components/ui";
import { useLogin, useRegister, startDemo } from "../hooks/useAuth";
import { authApi } from "../api";
import { Brand } from "../components/Brand";
export default function AuthPage() {
  const user = useSession((s) => s.user);
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [accountMode, setAccountMode] = useState<"owner" | "invited">(
    "invited",
  );
  const [invitation, setInvitation] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [resetting, setResetting] = useState(false);
  const login = useLogin();
  const registration = useRegister();
  if (user) return <Navigate to="/" replace />;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "reset") {
        setResetting(true);
        await authApi.reset(email);
        setNotice(
          "If the account exists, password reset instructions have been sent.",
        );
      } else {
        if (mode === "register") {
          if (password !== confirm)
            throw new Error("The passwords do not match.");
          await registration.mutateAsync({
            email: email.trim().toLowerCase(),
            password,
            full_name: name.trim(),
            account_mode: accountMode,
            ...(accountMode === "invited"
              ? { invitation_code: invitation.trim() }
              : {}),
          });
          setMode("login");
          setPassword("");
          setConfirm("");
          setInvitation("");
          setNotice(
            accountMode === "invited"
              ? "Your account was created and the farm invitation accepted. Sign in with your new password."
              : "Your account was created. Sign in to create your farm or join an existing one.",
          );
          return;
        }
        await login.mutateAsync({
          email: email.trim().toLowerCase(),
          password,
        });
      }
    } catch (e) {
      setError(e);
    } finally {
      setResetting(false);
    }
  }
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <Brand />
        <div className="auth-story-body">
          <div className="eyebrow">LESS ADMIN. MORE GROWING.</div>
          <h1>
            A clearer view
            <br />
            of your farm.
          </h1>
          <p>
            Bring your fields, work and resources together. Make the next
            decision with the whole picture in view.
          </p>
          <div className="auth-landscape" aria-hidden="true">
            <svg viewBox="0 0 500 230">
              <path d="M-10 110L250 0 510 110 250 230Z" fill="#f0eee3" />
              <path
                d="M0 118L245 13 490 118M25 131L245 37 465 131M52 144L245 61 438 144M80 157L245 85 410 157M108 170L245 109 382 170M136 183L245 133 354 183M164 196L245 157 326 196"
                fill="none"
                stroke="#7d9b79"
                strokeWidth="9"
              />
              <path d="M245 13V217" stroke="#e6dfc8" strokeWidth="13" />
            </svg>
            <span className="map-label">
              A little more organised, every day.
            </span>
          </div>
          <div className="auth-points">
            {[
              "One place for the work ahead",
              "A record of what your farm uses",
              "Your decisions, backed by context",
            ].map((t) => (
              <p key={t}>
                <Check size={16} />
                {t}
              </p>
            ))}
          </div>
        </div>
        <small>Built for the people who do the growing.</small>
      </section>
      <section className="auth-form-panel">
        <div className="mobile-brand">
          <Brand />
        </div>
        <div className="auth-form">
          <div className="eyebrow">YOUR FARM WORKSPACE</div>
          <h2>
            {mode === "login"
              ? "Welcome back"
              : mode === "register"
                ? "Make room for better work"
                : "Reset your password"}
          </h2>
          <p>
            {mode === "login"
              ? "Sign in and pick up where you left off."
              : mode === "register"
                ? "Join your farm team with an invitation, or create an account to set up your own farm."
                : "Enter the email address linked to your account."}
          </p>
          <form onSubmit={submit}>
            {mode === "register" && (
              <fieldset className="signup-choice">
                <legend>How will you use Fieldwork?</legend>
                <label>
                  <input
                    type="radio"
                    name="account-mode"
                    value="invited"
                    checked={accountMode === "invited"}
                    onChange={() => setAccountMode("invited")}
                  />
                  <span>
                    <strong>Join a farm</strong>
                    <small>
                      I have an invitation from my farm administrator.
                    </small>
                  </span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="account-mode"
                    value="owner"
                    checked={accountMode === "owner"}
                    onChange={() => setAccountMode("owner")}
                  />
                  <span>
                    <strong>Create my own farm</strong>
                    <small>I will set up a separate farm workspace.</small>
                  </span>
                </label>
              </fieldset>
            )}

            {mode === "register" && (
              <label className="field">
                Full name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </label>
            )}
            <label className="field">
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </label>
            {mode === "register" && accountMode === "invited" && (
              <label className="field">
                Invitation code
                <input
                  required
                  maxLength={512}
                  value={invitation}
                  onChange={(e) => setInvitation(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
                <small className="field-help">
                  Use the exact code from your administrator and the same email
                  address they invited. Your farm and role come from that
                  invitation.
                </small>
              </label>
            )}
            {mode !== "reset" && (
              <label className="field">
                Password
                <div className="password-input">
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete={
                      mode === "register" ? "new-password" : "current-password"
                    }
                  />
                  <button
                    type="button"
                    aria-label={show ? "Hide password" : "Show password"}
                    onClick={() => setShow(!show)}
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            )}
            {mode === "register" && (
              <label className="field">
                Confirm password
                <input
                  type={show ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </label>
            )}
            {mode === "login" && (
              <button
                type="button"
                className="text-link forgot-link"
                onClick={() => {
                  setMode("reset");
                  setNotice("");
                }}
              >
                Forgot password?
              </button>
            )}
            {error !== null && <ErrorBox error={error} />}
            <Button
              type="submit"
              className="w-full justify-center"
              loading={login.isPending || registration.isPending || resetting}
            >
              {mode === "login"
                ? "Sign in"
                : mode === "register"
                  ? accountMode === "invited"
                    ? "Create account & join farm"
                    : "Create account"
                  : "Send reset instructions"}
              <ArrowRight size={17} />
            </Button>
            {notice && (
              <p className="success-note" role="status">
                {notice}
              </p>
            )}
          </form>
          <p className="auth-switch">
            {mode === "login" ? "New here? " : ""}
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
                setNotice("");
              }}
            >
              {mode === "login" ? "Create an account" : "Back to sign in"}
            </button>
          </p>
          {mode === "reset" && (
            <Link className="text-link" to="/reset-password">
              Have a reset code?
            </Link>
          )}
          {import.meta.env.VITE_ENABLE_DEMO !== "false" && (
            <div className="demo-entry">
              <span>Want to look around first?</span>
              <Button variant="ghost" onClick={() => startDemo()}>
                Explore the preview
                <ArrowUpRight size={15} />
              </Button>
              <small>Sample records. Your real farm data stays separate.</small>
            </div>
          )}
        </div>
        <footer className="auth-footer">
          Fieldwork · Farm management, thoughtfully organised.
        </footer>
      </section>
    </main>
  );
}
