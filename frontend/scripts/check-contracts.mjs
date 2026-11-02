import fs from "node:fs";
import path from "node:path";
const snapshot = JSON.parse(
  fs.readFileSync("docs/backend-contract.json", "utf8"),
);
const features = fs.readdirSync("src/features");
const resources = [],
  commands = [];
for (const feature of features) {
  for (const [file, out] of [
    ["resources.ts", resources],
    ["commands.ts", commands],
  ]) {
    const p = path.join("src/features", feature, "components", file);
    if (!fs.existsSync(p)) continue;
    const content = fs.readFileSync(p, "utf8");
    for (const match of content.matchAll(/(?:"key"|\bkey)\s*:\s*"([^"]+)"/g))
      out.push(match[1]);
  }
}
for (const [name, actual, expected] of [
  ["resources", resources, Object.keys(snapshot.resources)],
  ["commands", commands, snapshot.commands],
]) {
  const missing = expected.filter((k) => !actual.includes(k)),
    extra = actual.filter((k) => !expected.includes(k));
  if (
    missing.length ||
    extra.length ||
    new Set(actual).size !== actual.length
  ) {
    console.error({ name, missing, extra });
    process.exit(1);
  }
}
console.log(
  `Contract coverage passed: ${resources.length} resources and ${commands.length} commands match the supplied backend.`,
);
