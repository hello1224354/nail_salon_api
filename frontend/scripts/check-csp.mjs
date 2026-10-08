// Production-only CSP regression. A successful build alone will not catch
// Next.js static HTML paired with a per-request nonce policy.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const port = 3108;
const base = `http://127.0.0.1:${port}`;
const app = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", String(port), "-H", "127.0.0.1"],
  { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NODE_ENV: "production" } },
);

let logs = "";
app.stdout.on("data", (chunk) => { logs += String(chunk); });
app.stderr.on("data", (chunk) => { logs += String(chunk); });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitUntilReady() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (app.exitCode !== null) throw new Error(`Next.js exited early:\n${logs}`);
    try {
      const response = await fetch(base, { signal: AbortSignal.timeout(2000) });
      await response.arrayBuffer();
      if (response.ok) return;
    } catch {
      // Still starting.
    }
    await wait(300);
  }
  throw new Error(`Next.js did not start within 30s:\n${logs}`);
}

async function checkPage(path) {
  const response = await fetch(`${base}${path}`, {
    headers: { Accept: "text/html" },
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  const html = await response.text();
  assert.equal(response.status, 200, `${path} HTTP ${response.status}: ${html.slice(0, 200)}`);

  const csp = response.headers.get("content-security-policy");
  assert.ok(csp, `${path} missing Content-Security-Policy`);
  const scriptPolicy = csp.match(/(?:^|;)\s*script-src\s+([^;]+)/)?.[1] ?? "";
  const nonce = scriptPolicy.match(/'nonce-([^']+)'/)?.[1];
  assert.ok(nonce, `${path} CSP missing script nonce: ${csp}`);
  assert.ok(scriptPolicy.includes("'strict-dynamic'"), `${path} must retain strict-dynamic`);
  assert.ok(!scriptPolicy.includes("'unsafe-inline'"), `${path} must not weaken script-src`);
  assert.ok(!scriptPolicy.includes("'unsafe-eval'"), `${path} must not allow eval`);

  // These are the exact scripts a browser refuses to execute if static HTML
  // was paired with a fresh CSP nonce during middleware/proxy.
  const scripts = [...html.matchAll(/<script\b([^>]*)>/gi)];
  assert.ok(scripts.length > 0, `${path} did not contain hydration scripts`);

  const withoutValidNonce = scripts.filter(([, attrs]) => {
    const value = attrs.match(/\bnonce=["']([^"']+)["']/i)?.[1];
    return value !== nonce;
  });
  assert.equal(
    withoutValidNonce.length,
    0,
    `${path}: ${withoutValidNonce.length}/${scripts.length} script tags do not match CSP nonce:\n${withoutValidNonce.slice(0, 3).map(x => x[0]).join("\n")}`,
  );
  console.log(`PASS ${path}: ${scripts.length} scripts match per-request nonce`);
  return nonce;
}

try {
  await waitUntilReady();
  const routes = ["/", "/services", "/book", "/login", "/admin", "/admin/login", "/admin/security"];
  const nonces = [];
  for (const route of routes) {
    nonces.push(await checkPage(route));
  }
  assert.equal(new Set(nonces).size, nonces.length, "CSP nonce must change on every request");
  const repeated = await checkPage("/admin");
  assert.ok(repeated !== nonces[4], "Repeat visit must rotate CSP nonce");
  console.log("PASS: CSP nonce rotation and Next.js hydration script authorization");
} catch (error) {
  console.error(error);
  console.error(logs.slice(-4000));
  process.exitCode = 1;
} finally {
  app.kill("SIGTERM");
}
