"use client";

import { useEffect, useRef, useState } from "react";

// Isolated PR-only responsive inspection. Each same-origin iframe has its own
// CSS viewport and native top-layer <dialog>, no booking data or API requests.
const DEVICES = [
  { key: "mobile", title: "Mobile portrait", width: 390, height: 844 },
  { key: "tablet", title: "Tablet portrait", width: 820, height: 1180 },
  { key: "desktop", title: "Desktop", width: 1440, height: 900 },
] as const;

function inspectFrame(iframe: HTMLIFrameElement | null): string {
  if (!iframe) return "Loading iframe...";
  try {
    const view = iframe.contentWindow;
    const doc = iframe.contentDocument;
    const dialog = doc?.querySelector<HTMLDialogElement>(".booking-success-dialog");
    if (!view || !dialog || !dialog.open) return "Waiting for the real booking success dialog to open...";

    const header = dialog.children.item(0) as HTMLElement | null;
    const details = dialog.querySelector<HTMLElement>(".booking-success-details");
    const actions = dialog.querySelector<HTMLElement>(".booking-success-actions");
    const summary = details?.lastElementChild as HTMLElement | null;
    if (!header || !details || !actions || !summary) return "Missing modal section";

    const d = dialog.getBoundingClientRect();
    const h = header.getBoundingClientRect();
    const s = details.getBoundingClientRect();
    const a = actions.getBoundingClientRect();
    const last = summary.getBoundingClientRect();
    const cs = view.getComputedStyle(dialog);
    const detailStyle = view.getComputedStyle(details);

    const fmt = (n: number) => n.toFixed(1);
    const beforeActions = a.top - last.bottom;
    const unaccounted = d.height - (h.height + s.height + a.height);
    const contentOverflow = dialog.scrollHeight > dialog.clientHeight + 1;

    return [
      `viewport=${view.innerWidth}x${view.innerHeight}; visualViewportHeight=${view.visualViewport?.height ?? "n/a"}`,
      `dialog: top=${fmt(d.top)} h=${fmt(d.height)} maxH=${cs.maxHeight} heightCSS=${cs.height} display=${cs.display} overflowY=${cs.overflowY} clientH=${dialog.clientHeight} scrollH=${dialog.scrollHeight}`,
      `header: top=${fmt(h.top)} h=${fmt(h.height)}`,
      `details: top=${fmt(s.top)} h=${fmt(s.height)} paddingBottom=${detailStyle.paddingBottom}`,
      `last-summary-card-bottom=${fmt(last.bottom)}`,
      `actions: top=${fmt(a.top)} h=${fmt(a.height)}`,
      `GAP_between_details_and_actions=${fmt(a.top - s.bottom)}px`,
      `GAP_from_last_card_to_actions=${fmt(beforeActions)}px (includes normal details padding)`,
      `UNACCOUNTED_DIALOG_HEIGHT=${fmt(unaccounted)}px (allow for 2px border)`,
      `CONTENT_OVERFLOW=${contentOverflow}`,
    ].join("\n");
  } catch (error) {
    return `Frame inspection blocked: ${String(error)}`;
  }
}

export default function BookingLayoutMatrix() {
  const frames = useRef<Record<string, HTMLIFrameElement | null>>({});
  const [measurements, setMeasurements] = useState<Record<string, string>>({});

  useEffect(() => {
    const measureAll = () => {
      const next = Object.fromEntries(DEVICES.map((device) =>
        [device.key, inspectFrame(frames.current[device.key])]));
      setMeasurements((prev) =>
        DEVICES.every((device) => prev[device.key] === next[device.key]) ? prev : next);
    };
    const poll = window.setInterval(measureAll, 500);
    measureAll();
    return () => window.clearInterval(poll);
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", background: "#f4f1ed", color: "#2b2521" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Booking modal responsive viewport matrix</h1>
      <p>No real bookings, API calls or customer information. Real popup markup; CSS viewports isolated in iframes.</p>
      <p>Mobile 390×844 · Tablet 820×1180 · Desktop 1440×900. These are viewport simulations in a browser, not physical devices.</p>
      {DEVICES.map((device) => (
        <section key={device.key} data-device={device.key} style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{device.title} — {device.width}×{device.height}</h2>
          <pre data-geometry={device.key} style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "white", color: "#222", fontSize: 12, padding: 12, border: "1px solid #ddd" }}>
            {measurements[device.key] ?? "Measuring..."}
          </pre>
          <div style={{ maxWidth: "100%", overflowX: "auto", border: "1px solid #d6c9be", background: "#fff" }}>
            <iframe
              ref={(el) => { frames.current[device.key] = el; }}
              title={device.title}
              src="/booking-success-preview"
              width={device.width}
              height={device.height}
              style={{ display: "block", width: device.width, height: device.height, border: 0 }}
            />
          </div>
        </section>
      ))}
    </main>
  );
}
