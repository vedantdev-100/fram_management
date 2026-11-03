import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

/** Click/tap help; buttons stay outside labels so opening help never changes a field. */
export function InfoHint({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const root = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLSpanElement>(null);
  const id = useId();
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current!.getBoundingClientRect();
      const height = panel.current?.offsetHeight || 140;
      const width = Math.min(310, window.innerWidth - 32);
      setPosition({
        left: Math.max(
          16,
          Math.min(rect.left - 12, window.innerWidth - width - 16),
        ),
        top: Math.max(
          16,
          rect.bottom + height + 16 <= window.innerHeight
            ? rect.bottom + 8
            : rect.top - height - 8,
        ),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape, true);
    };
  }, [open]);
  return (
    <span
      ref={root}
      className="info-hint"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node))
          setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="info-trigger"
        aria-label={`About ${label}`}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen(!open)}
      >
        <Info size={14} aria-hidden="true" />
      </button>
      {open && (
        <span
          ref={panel}
          id={id}
          className="info-panel"
          role="note"
          style={position}
        >
          <strong>{label}</strong>
          <span>{description}</span>
        </span>
      )}
    </span>
  );
}
