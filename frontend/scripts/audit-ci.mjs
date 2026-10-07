import { spawnSync } from "node:child_process";

const allowedAdvisories = new Set([
  "GHSA-vfj7-8cjw-p6xm",
]);

const result = spawnSync("npm", ["audit", "--json"], {
  encoding: "utf8",
  shell: process.platform === "win32",
});

if (result.error) {
  console.error("Unable to run npm audit:", result.error);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(result.stdout || "{}");
} catch {
  console.error("npm audit returned invalid JSON");
  if (result.stderr) console.error(result.stderr);
  process.exit(1);
}

const vulnerabilities = report.vulnerabilities ?? {};
const memo = new Map();

function advisoryId(via) {
  if (!via || typeof via !== "object") return null;
  const url = typeof via.url === "string" ? via.url : "";
  const match = url.match(/GHSA-[a-z0-9-]+/i);
  return match ? match[0] : null;
}

function isAllowed(name, visiting = new Set()) {
  if (memo.has(name)) return memo.get(name);

  const vulnerability = vulnerabilities[name];
  if (!vulnerability || !Array.isArray(vulnerability.via) || vulnerability.via.length === 0) {
    memo.set(name, false);
    return false;
  }

  if (visiting.has(name)) return false;
  const nextVisiting = new Set(visiting);
  nextVisiting.add(name);

  const allowed = vulnerability.via.every((via) => {
    if (typeof via === "string") {
      return isAllowed(via, nextVisiting);
    }

    const id = advisoryId(via);
    return id !== null && allowedAdvisories.has(id);
  });

  memo.set(name, allowed);
  return allowed;
}

const blocking = Object.entries(vulnerabilities).filter(([name, vulnerability]) => {
  const severity = String(vulnerability?.severity ?? "").toLowerCase();
  if (severity !== "high" && severity !== "critical") return false;
  return !isAllowed(name);
});

const waived = Object.keys(vulnerabilities).filter((name) => isAllowed(name));

if (waived.length > 0) {
  console.warn(
    "Waived unpatched dev-tooling advisory GHSA-vfj7-8cjw-p6xm for:",
    waived.join(", ")
  );
}

if (blocking.length > 0) {
  console.error("Blocking high/critical npm audit findings:");
  for (const [name, vulnerability] of blocking) {
    console.error(`- ${name}: ${vulnerability.severity}`);
  }
  process.exit(1);
}

console.log("npm audit: no unwaived high/critical vulnerabilities");
