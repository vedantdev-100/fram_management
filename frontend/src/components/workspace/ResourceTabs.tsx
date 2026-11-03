import { useLayoutEffect, useRef, useState } from "react";

export function ResourceTabs({
  id,
  title,
  resources,
  active,
  onSelect,
}: {
  id: string;
  title: string;
  resources: { key: string; title: string }[];
  active: string;
  onSelect: (key: string) => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  useLayoutEffect(() => {
    const measure = () => {
      const button = buttons.current[active];
      const root = viewport.current;
      if (!button || !root) return;
      setIndicator({ left: button.offsetLeft, width: button.offsetWidth });
      const right = button.offsetLeft + button.offsetWidth;
      const left = root.scrollLeft;
      const next =
        button.offsetLeft < left
          ? button.offsetLeft
          : right > left + root.clientWidth
            ? right - root.clientWidth
            : left;
      if (next !== left)
        root.scrollTo?.({
          left: next,
          behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        });
    };
    measure();
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : undefined;
    if (viewport.current) observer?.observe(viewport.current);
    for (const button of Object.values(buttons.current))
      if (button) observer?.observe(button);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [active, resources]);
  return (
    <div className="resource-tabs" ref={viewport}>
      <div
        className="resource-tabs-track"
        role="tablist"
        aria-label={`${title} sections`}
      >
        <span
          className="resource-tab-indicator"
          aria-hidden="true"
          style={{
            transform: `translateX(${indicator.left}px)`,
            width: indicator.width,
            opacity: indicator.width ? 1 : 0,
          }}
        />
        {resources.map((resource, index) => (
          <button
            key={resource.key}
            ref={(el) => {
              buttons.current[resource.key] = el;
            }}
            id={`${id}-tab-${resource.key}`}
            role="tab"
            type="button"
            aria-selected={active === resource.key}
            aria-controls={`${id}-panel`}
            tabIndex={active === resource.key ? 0 : -1}
            className={active === resource.key ? "active" : ""}
            onClick={() => onSelect(resource.key)}
            onKeyDown={(event) => {
              let target: number | undefined;
              if (event.key === "ArrowRight")
                target = (index + 1) % resources.length;
              if (event.key === "ArrowLeft")
                target = (index - 1 + resources.length) % resources.length;
              if (event.key === "Home") target = 0;
              if (event.key === "End") target = resources.length - 1;
              if (target !== undefined) {
                event.preventDefault();
                const key = resources[target].key;
                onSelect(key);
                buttons.current[key]?.focus();
              }
            }}
          >
            {resource.title}
          </button>
        ))}
      </div>
    </div>
  );
}
