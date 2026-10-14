"use client";

import { useEffect, useRef, useState } from "react";
import "../book/book.css";

// Preview route exists only in this isolated PR branch. No API calls or DB writes.
export default function BookingSuccessPreview() {
  const successDialogRef = useRef<HTMLDialogElement>(null);
  const [inspector, setInspector] = useState("");
  const [showInspector, setShowInspector] = useState(false);
  const [opened, setOpened] = useState(true);

  function closeSuccessModal() {
    successDialogRef.current?.close();
    setOpened(false);
  }
  function viewMyAppointments() { closeSuccessModal(); }
  useEffect(() => {
    const dialog = successDialogRef.current;
    if (!dialog || !opened) return;
    if (!dialog.open) dialog.showModal();

    const describe = () => {
      const sections = Array.from(dialog.children).filter((el) => el instanceof HTMLElement) as HTMLElement[];
      const dimensions = [dialog, ...sections].map((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return `${el === dialog ? "dialog" : el.className.split(" ")[0]}: top=${r.top.toFixed(1)}, height=${r.height.toFixed(1)}, scrollH=${el.scrollHeight}, display=${cs.display}, height=${cs.height}, maxH=${cs.maxHeight}, minH=${cs.minHeight}, flex=${cs.flex}, overflowY=${cs.overflowY}`;
      });
      dimensions.unshift(`window=${window.innerWidth}x${window.innerHeight} visual=${window.visualViewport?.height ?? "n/a"}`);
      setInspector(dimensions.join("\n"));
      dialog.dataset.geometry = JSON.stringify(dimensions);
    };
    const timer = window.setTimeout(describe, 300);
    const obs = new ResizeObserver(describe);
    obs.observe(dialog);
    for (const element of Array.from(dialog.children)) obs.observe(element);
    const onResize = () => describe();
    window.addEventListener("resize", onResize);
    return () => { window.clearTimeout(timer); obs.disconnect(); window.removeEventListener("resize", onResize); };
  }, [opened]);

  return (
    <main className="min-h-screen p-8">
      <h1>Booking modal – isolated preview (no real booking)</h1>
      <button type="button" onClick={() => { setOpened(true); requestAnimationFrame(() => successDialogRef.current?.showModal()); }} className="rounded-xl border p-3">
        Open preview popup
      </button>
      <button type="button" onClick={() => setShowInspector((v) => !v)} className="ml-4 rounded-xl border p-3">
        Toggle geometry
      </button>
      {opened ? (
        <>
                <dialog
                    ref={successDialogRef}
                    aria-labelledby="booking-success-title"
                    aria-describedby="booking-success-status"
                    onCancel={(event) => {
                        event.preventDefault();
                        closeSuccessModal();
                    }}
                    className="booking-success-dialog booking-success-panel rounded-[24px] border border-white/40 bg-surface p-0 focus:outline-none sm:rounded-[28px]"
                >
                    <div className="relative px-5 pb-4 pt-5 sm:px-8 sm:pb-5 sm:pt-7">
                        <button
                            type="button"
                            aria-label="Đóng thông báo"
                            onClick={closeSuccessModal}
                            className="focus-ring absolute right-5 top-5 flex size-9 items-center justify-center rounded-full border border-line bg-cream text-muted transition-colors hover:border-accent hover:text-ink sm:right-8 sm:top-7"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="block size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M4 4 20 20M20 4 4 20" />
                            </svg>
                        </button>

                        <div className="grid size-10 place-items-center rounded-full bg-tint text-accent sm:size-12">
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 sm:size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="m5 12.5 4.2 4.2L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent sm:mt-4">Đặt lịch thành công</p>
                        <h2 id="booking-success-title" className="mt-1.5 max-w-[28rem] font-serif text-[clamp(1.5rem,5vw,2.35rem)] leading-[1.12] tracking-[-0.02em]">
                            Serpente đã nhận lịch của bạn
                        </h2>
                        <p id="booking-success-status" className="mt-3 inline-flex rounded-full border border-accent/35 bg-tint px-3 py-1.5 text-[11px] font-semibold text-accent">
                            Chờ tiệm xác nhận
                        </p>
                    </div>

                    <div className="booking-success-details border-t border-line px-5 py-4 sm:px-8 sm:py-5">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                            <div className="min-w-0">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Chi nhánh</p>
                                <p className="mt-1 break-words text-sm font-semibold">{"Quận 8"}</p>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Số người</p>
                                <p className="mt-1 text-sm font-semibold">{"1"} người</p>
                            </div>
                            <div className="col-span-2 min-w-0">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Thời gian</p>
                                <p className="mt-1 text-sm font-semibold">{"Thứ 5, 15 tháng 10, 2026"}</p>
                                <p className="mt-0.5 text-xs text-muted">
                                    {"10:00"}–{"10:15"}
                                </p>
                            </div>
                            <div className="col-span-2 min-w-0">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Dịch vụ</p>
                                <p className="mt-1 break-words text-sm leading-5">
                                    {"Massage"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid min-w-0 grid-cols-2 items-end gap-3 rounded-[16px] bg-cream p-3.5 sm:mt-5 sm:p-4">
                            <div className="min-w-0">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">Mã lịch hẹn</p>
                                <p className="mt-1 break-all font-mono text-xs font-semibold tracking-[0.04em]">
                                    {"PREVIEW1"}
                                </p>
                            </div>
                            <div className="min-w-0 text-right">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">Tổng giá tham khảo</p>
                                <p className="mt-1 break-words font-serif text-[clamp(1rem,3.5vw,1.25rem)] tabular-nums">
                                    {"120.000"} VND
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="booking-success-actions grid grid-cols-2 gap-2 border-t border-line bg-surface px-5 py-4 sm:px-8 sm:py-5">
                        <button
                            type="button"
                            onClick={closeSuccessModal}
                            className="focus-ring min-h-11 min-w-0 rounded-full border border-line bg-surface px-3 py-3 text-xs font-semibold text-ink transition-colors hover:border-accent/50"
                        >
                            Đóng
                        </button>
                        <button
                            type="button"
                            onClick={viewMyAppointments}
                            className="focus-ring min-h-11 min-w-0 rounded-full bg-ink px-3 py-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        >
                            Xem lịch của tôi
                        </button>
                    </div>
                </dialog>
          {showInspector && inspector ? <output style={{ position: "fixed", inset: "auto 0 0", zIndex: 9999, background: "white", color: "black", padding: 8, fontSize: 11, whiteSpace: "pre-wrap", pointerEvents: "none", maxHeight: "30vh", overflow: "auto" }}>{inspector}</output> : null}
        </>
      ) : null}
      <pre id="modal-geometry" className="mt-4 whitespace-pre-wrap text-xs">{inspector}</pre>
    </main>
  );
}
