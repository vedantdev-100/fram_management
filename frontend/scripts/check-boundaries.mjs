import fs from "node:fs";
import path from "node:path";
const src = path.resolve("src");
const files = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((d) =>
      d.isDirectory()
        ? files(path.join(dir, d.name))
        : /\.tsx?$/.test(d.name)
          ? [path.join(dir, d.name)]
          : [],
    );
const violations = [];
for (const file of files(src)) {
  const own = path.relative(src, file).match(/^features[\\/]([^\\/]+)/)?.[1];
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(
    /(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g,
  )) {
    const target = match[1];
    const abs = target.startsWith("@/")
      ? path.join(src, target.slice(2))
      : target.startsWith(".")
        ? path.resolve(path.dirname(file), target)
        : null;
    if (!abs) continue;
    const rel = path.relative(src, abs).replaceAll("\\", "/");
    const other = rel.match(/^features\/([^/]+)(?:\/(.*))?$/);
    if (other && own && other[1] !== own)
      violations.push(
        `${path.relative(src, file)} imports another feature: ${target}`,
      );
    if (other && !own && other[2] && other[2] !== "index")
      violations.push(
        `${path.relative(src, file)} bypasses a feature's public index: ${target}`,
      );
  }
}
if (violations.length) {
  console.error(violations.join("\n"));
  process.exit(1);
}
console.log(
  "Feature boundaries passed: no cross-feature imports or private-entry access.",
);
