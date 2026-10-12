import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const chrome = ["google-chrome", "chromium", "chromium-browser"].find(
    (command) => spawnSync("which", [command], { stdio: "ignore" }).status === 0,
);
if (!chrome) throw new Error("Headless Chrome required");
const profile = mkdtempSync(join(tmpdir(), "booking-dialog-"));
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3002"], { stdio: "ignore" });
const browser = spawn(chrome, [
    "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu",
    "--remote-allow-origins=*", "--remote-debugging-port=9338",
    "--user-data-dir=" + profile, "about:blank",
], { stdio: "ignore" });

async function until(fn, label) {
    for (let i = 0; i < 120; i++) {
        try { const result = await fn(); if (result) return result; }
        catch { /* App or browser may still be starting. */ }
        await sleep(250);
    }
    throw new Error("Timed out waiting for " + label);
}

async function clientFor(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
        ws.addEventListener("open", resolve, { once: true });
        ws.addEventListener("error", reject, { once: true });
    });
    let nextId = 0;
    const requests = new Map();
    ws.addEventListener("message", ({ data }) => {
        const message = JSON.parse(data);
        const req = requests.get(message.id);
        if (!req) return;
        requests.delete(message.id);
        if (message.error) req.reject(new Error(JSON.stringify(message.error)));
        else req.resolve(message.result);
    });
    return {
        send(method, params = {}, sessionId) {
            return new Promise((resolve, reject) => {
                const id = ++nextId;
                requests.set(id, { resolve, reject });
                ws.send(JSON.stringify({ id, method, params, sessionId }));
            });
        },
        close: () => ws.close(),
    };
}

// Use the real production styles on /book and a synthetic appointment outcome.
// No actual booking is submitted; this checks modal layout only.
function renderModalFixture() {
    const modal = document.createElement("dialog");
    modal.className = "booking-success-dialog booking-success-panel min-h-0 flex-col overflow-hidden rounded-[24px] border border-white/40 bg-surface p-0";
    const header = document.createElement("div");
    header.className = "relative shrink-0 px-5 pb-4 pt-5";
    header.innerHTML = '<p class="text-xs">Đặt lịch thành công</p><h2 class="mt-1.5 font-serif text-[clamp(1.5rem,5vw,2.35rem)] leading-[1.12]">Serpente đã nhận lịch của bạn</h2><p class="mt-3">Chờ tiệm xác nhận</p>';
    const content = document.createElement("div");
    content.className = "booking-success-details min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-line px-5 py-4";
    content.innerHTML = new Array(12).fill('<p class="mb-4 text-sm">Thời gian, chi nhánh, số người và chi tiết dịch vụ</p>').join("");
    const actions = document.createElement("div");
    actions.className = "booking-success-actions grid shrink-0 grid-cols-2 gap-2 border-t border-line bg-surface px-5 py-4";
    actions.innerHTML = '<button class="min-h-11 rounded-full border px-3 py-3">Đóng</button><button class="min-h-11 rounded-full bg-ink px-3 py-3 text-white">Xem lịch của tôi</button>';
    modal.append(header, content, actions);
    document.body.appendChild(modal);
    modal.showModal();

    const rect = modal.getBoundingClientRect();
    const buttons = [...modal.querySelectorAll("button")].map((node) => node.getBoundingClientRect());
    return {
        topLayer: modal.matches(":modal"),
        top: rect.top,
        bottom: rect.bottom,
        windowHeight: window.innerHeight,
        buttonsVisible: buttons.every((item) => item.top >= 0 && item.bottom <= innerHeight),
        contentScrollable: content.scrollHeight > content.clientHeight,
        actionsHeight: actions.getBoundingClientRect().height,
    };
}

let client;
try {
    await until(async () => (await fetch("http://127.0.0.1:3002/book")).ok, "Next.js");
    const version = await until(async () => (await fetch("http://127.0.0.1:9338/json/version")).json(), "Chrome");
    client = await clientFor(version.webSocketDebuggerUrl);
    const target = await client.send("Target.createTarget", { url: "about:blank" });
    const attached = await client.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    await client.send("Page.enable", {}, attached.sessionId);
    mkdirSync("responsive-artifacts", { recursive: true });

    for (const { width, height } of [
        { width: 320, height: 568 },
        { width: 360, height: 640 },
        { width: 390, height: 844 },
        { width: 768, height: 1024 },
    ]) {
        await client.send("Emulation.setDeviceMetricsOverride", {
            width, height, deviceScaleFactor: 1, mobile: true,
        }, attached.sessionId);
        await client.send("Page.navigate", { url: "http://127.0.0.1:3002/book" }, attached.sessionId);
        await until(async () => {
            const result = await client.send("Runtime.evaluate", {
                expression: 'document.readyState === "complete" && !!document.querySelector("main")',
                returnByValue: true,
            }, attached.sessionId);
            return result.result?.value;
        }, "booking route");
        const run = await client.send("Runtime.evaluate", {
            expression: "(" + renderModalFixture.toString() + ")()", returnByValue: true,
        }, attached.sessionId);
        if (run.exceptionDetails) throw new Error(JSON.stringify(run.exceptionDetails));
        const result = run.result.value;
        console.log("CHECK modal " + width + "x" + height, result);
        assert.ok(result.topLayer, "Native modal must use the browser top layer");
        assert.ok(result.top >= -1 && result.bottom <= result.windowHeight + 1, "Modal exceeds visual viewport");
        assert.ok(result.buttonsVisible, "A booking action is outside the viewport");
        assert.ok(result.contentScrollable, "Confirmation details must scroll independently");
        const img = await client.send("Page.captureScreenshot", {
            format: "png", captureBeyondViewport: false,
        }, attached.sessionId);
        writeFileSync("responsive-artifacts/booking-dialog-" + width + "x" + height + ".png", Buffer.from(img.data, "base64"));
        console.log("PASS booking modal " + width + "x" + height, result);
    }
} finally {
    client?.close();
    browser.kill("SIGTERM");
    server.kill("SIGTERM");
}
