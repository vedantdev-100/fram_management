import { headingHelp } from "@/lib/fieldHelp";
import { InfoHint } from "./InfoHint";
import { useEffect, useRef, useId } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Inbox,
  ArrowUpRight,
} from "lucide-react";
import clsx from "clsx";
import { ApiError } from "@/api/client";
import { useToasts } from "@/stores/toasts";
import { humanize } from "@/lib/format";
export function Button({
  children,
  variant = "primary",
  loading = false,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      {...props}
      disabled={loading || props.disabled}
      className={clsx("button", `button-${variant}`, className)}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
export function Badge({ value }: { value: unknown }) {
  const s = String(value ?? "unknown");
  return (
    <span
      className={clsx("badge", {
        "badge-green": [
          "active",
          "done",
          "completed",
          "cleared",
          "balanced",
          "adopted",
          "pass",
        ].includes(s),
        "badge-amber": [
          "planned",
          "pending",
          "reserved",
          "in_progress",
          "open",
          "warn",
          "due",
          "invited",
        ].includes(s),
        "badge-red": [
          "failed",
          "off",
          "block",
          "overdue",
          "suspended",
          "abandoned",
        ].includes(s),
      })}
    >
      <span className="badge-dot" />
      {humanize(s)}
    </span>
  );
}
export function Spinner({
  label = "Loading your workspace…",
}: {
  label?: string;
}) {
  return (
    <div className="loading-state" role="status">
      <Loader2 className="animate-spin" size={22} />
      <span>{label}</span>
    </div>
  );
}
export function ErrorBox({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  const e = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div className="error-box" role="alert">
      <AlertCircle size={19} />
      <div>
        <strong>
          {error instanceof ApiError && error.status === 403
            ? "Access is restricted"
            : "We couldn’t complete that"}
        </strong>
        <p>{e}</p>
        {error instanceof ApiError &&
        error.fields &&
        typeof error.fields === "object" ? (
          <ul>
            {Object.entries(error.fields)
              .filter(([k]) => k !== "detail")
              .slice(0, 8)
              .map(([k, v]) => (
                <li key={k}>
                  {humanize(k)}:{" "}
                  {typeof v === "object" ? JSON.stringify(v) : String(v)}
                </li>
              ))}
          </ul>
        ) : null}
        {retry && (
          <button className="text-link" onClick={retry}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
export function EmptyState({
  title = "Nothing here yet",
  description = "Add the first record when you’re ready.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Inbox size={25} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Modal({
  title,
  description,
  children,
  onClose,
  wide = false,
  busy = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const d = ref.current;
    const previous = document.activeElement as HTMLElement;
    d?.showModal();
    return () => {
      d?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={clsx("modal", wide && "modal-wide")}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <div className="modal-header">
        <div>
          <div className="heading-help-row">
            <h2 id={titleId}>{title}</h2>
            <InfoHint
              label={title}
              description={
                description ||
                "Complete the fields marked with an asterisk. Use the info buttons beside individual fields for explanations. Changes are applied only when you submit the form or confirm an action."
              }
            />
          </div>
          {description && <p id={descriptionId}>{description}</p>}
        </div>
        <button
          className="icon-button"
          disabled={busy}
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
export function Toasts() {
  const { items, remove } = useToasts();
  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          className={clsx("toast", t.kind === "error" && "toast-error")}
        >
          {t.kind === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{t.title}</span>
          <button
            onClick={() => remove(t.id)}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <div className="heading-help-row">
          <h1>{title}</h1>
          <InfoHint
            label={title}
            description={headingHelp(title, description)}
          />
        </div>
        <p>{description}</p>
      </div>
      <div className="page-actions">{actions}</div>
    </header>
  );
}
export function Panel({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <div className="heading-help-row">
            <h2>{title}</h2>
            {subtitle && (
              <InfoHint
                label={title}
                description={headingHelp(title, subtitle)}
              />
            )}
          </div>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
export function ExternalLabel() {
  return <ArrowUpRight size={14} />;
}
