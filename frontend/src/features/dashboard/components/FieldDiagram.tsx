import type { Row } from "@/types";
import { labelFor } from "@/lib/format";
export function FieldDiagram({ blocks }: { blocks: Row[] }) {
  type Point = [number, number];
  const shapes = blocks.flatMap((b, i) => {
    const g = b.geometry as { type?: string; coordinates?: unknown } | null;
    if (!g?.coordinates) return [];
    const points =
      g.type === "MultiPolygon"
        ? (g.coordinates as Point[][][])[0][0]
        : (g.coordinates as Point[][])[0];
    return [
      {
        id: b.id,
        label: labelFor(b),
        points,
        color: ["#8ca878", "#c4b278", "#9fb8a3", "#adbf88"][i % 4],
      },
    ];
  });
  if (!shapes.length)
    return (
      <div className="field-directory">
        {blocks.slice(0, 4).map((b, i) => (
          <div key={b.id}>
            <span
              style={{
                background: ["#8ca878", "#c4b278", "#9fb8a3", "#adbf88"][i % 4],
              }}
            />
            <strong>{labelFor(b)}</strong>
            <small>{String(b.code || "Block")}</small>
          </div>
        ))}
        <p>Draw boundaries in Field plan to see them here.</p>
      </div>
    );
  const all = shapes.flatMap((s) => s.points);
  const xmin = Math.min(...all.map((p) => p[0])),
    xmax = Math.max(...all.map((p) => p[0])),
    ymin = Math.min(...all.map((p) => p[1])),
    ymax = Math.max(...all.map((p) => p[1]));
  const dx = xmax - xmin || 1,
    dy = ymax - ymin || 1;
  const scale = Math.min(410 / dx, 205 / dy);
  const x = (v: number) => 45 + (v - xmin) * scale;
  const y = (v: number) => 245 - (v - ymin) * scale;
  return (
    <div className="field-map">
      <svg
        viewBox="0 0 500 290"
        role="img"
        aria-label="Recorded farm block boundaries, shown as a local schematic"
      >
        <defs>
          <pattern
            id="fieldGrid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M20 0H0V20"
              fill="none"
              stroke="#e5e9df"
              strokeWidth=".7"
            />
          </pattern>
        </defs>
        <rect width="500" height="290" fill="url(#fieldGrid)" />
        {shapes.map((s) => {
          const cx = s.points.reduce((a, p) => a + p[0], 0) / s.points.length,
            cy = s.points.reduce((a, p) => a + p[1], 0) / s.points.length;
          return (
            <g key={s.id}>
              <polygon
                points={s.points.map((p) => `${x(p[0])},${y(p[1])}`).join(" ")}
                fill={s.color}
                stroke="#f9faf7"
                strokeWidth="5"
              />
              <text
                x={x(cx)}
                y={y(cy)}
                textAnchor="middle"
                fill="#243a2a"
                fontSize="11"
                fontWeight="600"
              >
                {s.label}
              </text>
            </g>
          );
        })}
        <text x="470" y="28" fontSize="11" fill="#72806d">
          N ↑
        </text>
      </svg>
      <span>Recorded boundaries · schematic view</span>
    </div>
  );
}
