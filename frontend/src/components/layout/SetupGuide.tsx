import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, ChevronDown, Route } from "lucide-react";
import type { CSSProperties } from "react";
import { setupGuides } from "@/components/setup/guides";

export function SetupGuide({ pathname }: { pathname: string }) {
  const guide = setupGuides[pathname];
  const [open, setOpen] = useState(true);
  if (!guide) return null;
  return (
    <section className="setup-guide" aria-label="Farm setup guide">
      <button
        className="setup-guide-trigger"
        aria-expanded={open}
        aria-controls="page-setup-flow"
        onClick={() => setOpen(!open)}
      >
        <span className="setup-guide-icon">
          <Route size={19} />
        </span>
        <span>
          <small>START HERE · SETUP FLOW</small>
          <strong>{guide.title}</strong>
        </span>
        <span className="setup-guide-toggle">
          {open ? "Hide guide" : "Show guide"}
          <ChevronDown size={16} className={open ? "is-open" : ""} />
        </span>
      </button>
      <div
        id="page-setup-flow"
        className={"setup-guide-collapse " + (open ? "is-expanded" : "")}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="setup-guide-collapse-inner">
          <div className="setup-guide-body">
            <p>{guide.introduction}</p>
            <ol
              className="setup-flow"
              style={{ "--flow-steps": guide.steps.length } as CSSProperties}
              aria-label="Recommended setup order"
            >
              {guide.steps.map((step, index) => (
                <li key={step.title}>
                  <Link to={step.href} className="setup-step">
                    <span className="setup-step-top">
                      <span className="setup-number">{index + 1}</span>
                      {step.optional && <small>Optional</small>}
                      <ArrowRight size={14} className="setup-step-link" />
                    </span>
                    <strong>{step.title}</strong>
                    <span className="setup-step-text">{step.text}</span>
                  </Link>
                  {index < guide.steps.length - 1 && (
                    <span className="setup-connector" aria-hidden="true">
                      <ArrowRight className="flow-horizontal" size={16} />
                      <ArrowDown className="flow-vertical" size={16} />
                    </span>
                  )}
                </li>
              ))}
            </ol>
            {guide.note && <p className="setup-guide-note">{guide.note}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
