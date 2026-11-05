import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, ReactElement, SelectHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

/** The native control retains required-field validation; the popup follows the app theme. */
export function Select({
  children,
  value = "",
  onChange,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 260,
  });
  const button = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const native = useRef<HTMLSelectElement>(null);
  const listId = useId();
  const options = Children.toArray(children)
    .filter(isValidElement)
    .map(
      (child) =>
        (
          child as ReactElement<{
            value?: string;
            children?: React.ReactNode;
            disabled?: boolean;
          }>
        ).props,
    );
  const selected = options.find((o) => String(o.value ?? "") === String(value));
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (
        !button.current?.contains(event.target as Node) &&
        !popup.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    const reposition = () => setOpen(false);
    const scroll = (event: Event) => {
      if (!popup.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("scroll", scroll, true);
    document.addEventListener("pointerdown", close);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("pointerdown", close);
      window.removeEventListener("resize", reposition);
      document.removeEventListener("scroll", scroll, true);
    };
  }, [open]);
  useEffect(() => {
    if (open)
      popup.current
        ?.querySelector<HTMLElement>(`[data-index="${index}"]`)
        ?.scrollIntoView?.({ block: "nearest" });
  }, [open, index]);
  function choose(i: number) {
    if (options[i]?.disabled) return;
    const next = String(options[i]?.value ?? "");
    if (native.current) native.current.value = next;
    onChange?.({
      target: native.current,
      currentTarget: native.current,
    } as ChangeEvent<HTMLSelectElement>);
    setOpen(false);
    button.current?.focus();
  }
  function show() {
    const rect = button.current!.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 12;
    const height = Math.min(
      260,
      Math.max(100, below >= 160 ? below : rect.top - 12),
    );
    setPosition({
      left: Math.max(
        8,
        Math.min(rect.left, window.innerWidth - rect.width - 8),
      ),
      width: rect.width,
      top: below >= 160 ? rect.bottom + 5 : Math.max(8, rect.top - height - 5),
      maxHeight: height,
    });
    setIndex(
      Math.max(
        0,
        options.findIndex((o) => String(o.value ?? "") === String(value)),
      ),
    );
    setOpen(true);
  }
  return (
    <div className={`styled-select ${className}`}>
      <select
        {...props}
        id={props.id ? props.id + "-validation" : undefined}
        ref={native}
        className="select-validation"
        tabIndex={-1}
        aria-hidden="true"
        value={value}
        onChange={onChange}
        onInvalid={(e) => {
          e.preventDefault();
          button.current?.focus();
          show();
        }}
      >
        {children}
      </select>
      <button
        type="button"
        ref={button}
        id={props.id}
        className="select-trigger"
        disabled={props.disabled}
        aria-label={props["aria-label"]}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${index}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (
            [
              "ArrowDown",
              "ArrowUp",
              "Home",
              "End",
              "Enter",
              " ",
              "Escape",
            ].includes(e.key)
          ) {
            e.preventDefault();
            if (e.key === "Escape") {
              e.stopPropagation();
              setOpen(false);
              return;
            }
            if (!open) {
              show();
              return;
            }
            if (e.key === "Enter" || e.key === " ") {
              choose(index);
              return;
            }
            const step = e.key === "ArrowUp" ? -1 : 1;
            let next =
              e.key === "Home"
                ? 0
                : e.key === "End"
                  ? options.length - 1
                  : (index + step + options.length) % options.length;
            for (let n = 0; n < options.length && options[next]?.disabled; n++)
              next = (next + step + options.length) % options.length;
            setIndex(next);
          } else if (e.key === "Tab") setOpen(false);
          else if (open && e.key.length === 1) {
            const next = options.findIndex((o) =>
              String(o.children).toLowerCase().startsWith(e.key.toLowerCase()),
            );
            if (next >= 0) setIndex(next);
          }
        }}
      >
        <span>{selected?.children || "Choose an option"}</span>
        <ChevronDown size={15} />
      </button>
      {open &&
        createPortal(
          <div
            ref={popup}
            id={listId}
            role="listbox"
            className="select-popup"
            style={position}
            aria-label={props["aria-label"] || "Choices"}
          >
            {options.map((o, i) => (
              <div
                key={String(o.value ?? i)}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={String(value) === String(o.value ?? "")}
                aria-disabled={o.disabled || undefined}
                data-index={i}
                className={i === index ? "is-highlighted" : ""}
                onPointerDown={(e) => e.preventDefault()}
                onMouseEnter={() => setIndex(i)}
                onClick={() => choose(i)}
              >
                <span>{o.children}</span>
                {String(value) === String(o.value ?? "") && <Check size={15} />}
              </div>
            ))}
          </div>,
          button.current?.closest("dialog") || document.body,
        )}
    </div>
  );
}
