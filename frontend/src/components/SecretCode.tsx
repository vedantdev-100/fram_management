import { useState } from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
export function SecretCode({ value }: { value: unknown }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  if (!value)
    return (
      <span className="muted">
        Unavailable · used, expired, or older invitation
      </span>
    );
  return (
    <div className="secret-code" onClick={(e) => e.stopPropagation()}>
      <code>{shown ? String(value) : "••••••••••••"}</code>
      <button
        type="button"
        className="icon-button"
        aria-label={shown ? "Hide invitation code" : "Show invitation code"}
        onClick={() => setShown(!shown)}
      >
        {shown ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
      <button
        type="button"
        className="icon-button"
        aria-label="Copy invitation code"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(String(value));
            setCopied(true);
            setError("");
          } catch {
            setShown(true);
            setError("Select and copy the revealed code.");
          }
        }}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
      <span role="status">{error || (copied ? "Copied" : "")}</span>
    </div>
  );
}
