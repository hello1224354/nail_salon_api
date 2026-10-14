"use client";

import { useEffect, useRef, useState } from "react";

// PR-only inspector. Uses actual server-rendered preview dialog and its CSS.
// srcDoc stays same-origin but avoids X-Frame-Options: DENY on normal page URLs.
const DEVICES = [
  { key: "mobile", title: "Mobile portrait", width: 390, height: 844 },
  { key: "tablet", title: "Tablet portrait", width: 820, height: 1180 },
  { key: "desktop", title: "Desktop", width: 1440, height: 900 },
] as const;

function inspectFrame(frame: HTMLIFrameElement | null): string {
  if (!frame) return "Waiting for iframe...";
  try {
    const view = frame.contentWindow;
    const doc = frame.contentDocument;
    const dialog = doc?.querySelector<HTMLDialogElement>(".booking-success-dialog");
    if (!view || !doc || !dialog) return "Waiting for preview markup/styles...";
    if (!dialog.open) dialog.showModal();

    const header = dialog.children.item(0) as HTMLElement | null;
    const details = dialog.querySelector<HTMLElement>(".booking-success-details");
    const actions = dialog.querySelector<HTMLElement>(".booking-success-actions");
    const summary = details?.lastElementChild as HTMLElement | null;
    if (!header || !details || !actions || !summary) return "Missing dialog section";

    const fmt = (n: number) => n.toFixed(1);
    const d = dialog.getBoundingClientRect();
    const h = header.getBoundingClientRect();
    const s = details.getBoundingClientRect();
    const a = actions.getBoundingClientRect();
    const last = summary.getBoundingClientRect();
    const css = view.getComputedStyle(dialog);
    const detailCss = view.getComputedStyle(details);
    const sum = h.height + s.height + a.height;
    return [
      `viewport=${view.innerWidth}x${view.innerHeight} visual=${view.visualViewport?.height ?? "n/a"}`,
      `dialog: top=${fmt(d.top)} height=${fmt(d.height)} maxH=${css.maxHeight} heightCSS=${css.height} display=${css.display} overflowY=${css.overflowY} clientHeight=${dialog.clientHeight} scrollHeight=${dialog.scrollHeight}`,
      `header: top=${fmt(h.top)} height=${fmt(h.height)}`,
      `details: top=${fmt(s.top)} height=${fmt(s.height)} paddingBottom=${detailCss.paddingBottom}`,
      `last-summary-bottom=${fmt(last.bottom)}`,
      `actions: top=${fmt(a.top)} height=${fmt(a.height)}`,
      `GAP_between_details_and_actions=${fmt(a.top - s.bottom)}px`,
      `GAP_from_last_card_to_actions=${fmt(a.top - last.bottom)}px (includes regular padding)`,
      `UNACCOUNTED_DIALOG_HEIGHT=${fmt(d.height - sum)}px (includes border)`,
      `CONTENT_OVERFLOW=${dialog.scrollHeight > dialog.clientHeight + 1}`,
      `HORIZONTAL_OVERFLOW=${doc.documentElement.scrollWidth > view.innerWidth + 1}`,
    ].join("\n");
  } catch (error) {
    return `Frame error: ${String(error)}`;
  }
}

export default function BookingLayoutMatrix() {
  const [frameMarkup, setFrameMarkup] = useState("");
  const [sourceStatus, setSourceStatus] = useState("Loading genuine preview dialog...");
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const frames = useRef<Record<string, HTMLIFrameElement | null>>({});

  useEffect(() => {
    let active = true;
    const loadSource = async () => {
      try {
        const response = await fetch("/booking-success-preview", { cache: "no-store" });
        if (!response.ok) throw new Error(`Preview HTML HTTP ${response.status}`);
        const html = await response.text();
        const parsed = new DOMParser().parseFromString(html, "text/html");
        const dialog = parsed.querySelector("dialog.booking-success-dialog");
        if (!dialog) throw new Error("Booking success dialog missing from SSR HTML");
        const sheets = Array.from(parsed.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
          .map((link) => link.href || link.getAttribute("href") || "")
          .filter((href) => href.startsWith("/") || href.startsWith(window.location.origin))
          .map((href) => `<link rel="stylesheet" href="${href.replaceAll('"', "&quot;")}" />`).join("\n");
        if (!sheets) throw new Error("CSS stylesheet links missing from preview HTML");

        // Raw SSR dialog markup has only static sample values. No scripts or API calls.
        const source = `<!doctype html><html lang="vi"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><base href="${window.location.origin}/"/>${sheets}</head><body style="margin:0;background:#f5f2ee">${dialog.outerHTML}</body></html>`;
        if (active) {
          setFrameMarkup(source);
          setSourceStatus("Actual SSR dialog + actual Next.js CSS loaded in srcDoc frames (no iframe page navigation)");
        }
      } catch (error) {
        if (active) setSourceStatus(`Preview setup failed: ${String(error)}`);
      }
    };
    void loadSource();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!frameMarkup) return;
    const measure = () => {
      const next = Object.fromEntries(DEVICES.map((device) =>
        [device.key, inspectFrame(frames.current[device.key])]));
      setMeasurements((prev) =>
        DEVICES.every((device) => prev[device.key] === next[device.key]) ? prev : next);
    };
    const poll = window.setInterval(measure, 650);
    measure();
    return () => window.clearInterval(poll);
  }, [frameMarkup]);

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", color: "#2b2521", background: "#f4f1ed" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Booking modal responsive viewport matrix</h1>
      <p>No real bookings, email, or API mutations. Actual SSR dialog markup and styles; 3 independent simulated CSS viewports.</p>
      <p id="source-status">{sourceStatus}</p>
      {DEVICES.map((device) => (
        <section key={device.key} data-device={device.key} style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{device.title} — {device.width}×{device.height}</h2>
          <pre data-geometry={device.key} style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "white", color: "#222", fontSize: 12, padding: 12, border: "1px solid #ddd" }}>
            {measurements[device.key] ?? "Measuring..."}
          </pre>
          <div style={{ maxWidth: "100%", overflowX: "auto", border: "1px solid #d6c9be", background: "#fff" }}>
            {frameMarkup ? <iframe
              ref={(element) => { frames.current[device.key] = element; }}
              title={device.title}
              srcDoc={frameMarkup}
              width={device.width}
              height={device.height}
              style={{ display: "block", width: device.width, height: device.height, border: 0 }}
            /> : null}
          </div>
        </section>
      ))}
    </main>
  );
}
