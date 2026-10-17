"use client";

import { useState } from "react";
import { apiRequest, getApiErrorMessage } from "@/lib/api";

const inputClass = "h-11 min-w-0 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink outline-none focus:border-accent";

export function ServiceCategoryPicker({
    categories, initial, onCreated,
}: {
    categories: string[];
    initial: string;
    onCreated: (name: string) => void;
}) {
    const [selected, setSelected] = useState(initial);
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    async function addGroup() {
        const trimmed = name.trim();
        if (trimmed.length < 2 || trimmed.length > 80) {
            setError("Tên nhóm phải có từ 2 đến 80 ký tự.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            const data = await apiRequest<{ name: string }>("/api/services/categories", {
                method: "POST",
                body: JSON.stringify({ name: trimmed }),
            });
            onCreated(data.name);
            setSelected(data.name);
            setName("");
            setAdding(false);
        } catch (cause) {
            setError(getApiErrorMessage(cause, "Không thể thêm nhóm dịch vụ."));
        } finally {
            setBusy(false);
        }
    }
    return <div className="md:col-span-2">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="service-category" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Nhóm dịch vụ
            </label>
            <button type="button" onClick={() => { setAdding(v => !v); setError(""); }}
                className="rounded-full border border-line bg-white px-3 py-1.5 text-[11px] font-semibold text-accent hover:border-accent">
                {adding ? "Đóng" : "+ Thêm nhóm"}
            </button>
        </div>
        <select id="service-category" name="category" value={selected}
            onChange={event => setSelected(event.target.value)}
            className={inputClass} required>
            <option value="" disabled>Chọn nhóm dịch vụ</option>
            {categories.map(category => <option key={category} value={category}>{category}</option>)}
        </select>
        {adding ? <div className="mt-3 rounded-xl border border-line bg-white/70 p-3">
            <label htmlFor="new-service-group" className="block text-xs font-semibold">Tên nhóm mới</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input id="new-service-group" type="text" autoComplete="off"
                    value={name} maxLength={80}
                    onChange={event => setName(event.target.value)}
                    onKeyDown={event => {
                        if (event.key === "Enter") { event.preventDefault(); void addGroup(); }
                    }}
                    className={inputClass} placeholder="Nhập tên nhóm dịch vụ" />
                <button type="button" disabled={busy}
                    onClick={() => void addGroup()}
                    className="h-11 shrink-0 rounded-full bg-ink px-5 text-xs font-semibold text-white disabled:opacity-40">
                    {busy ? "Đang thêm…" : "Lưu nhóm"}
                </button>
            </div>
            {error ? <p role="alert" className="mt-2 text-xs text-[#854d42]">{error}</p> : null}
        </div> : null}
    </div>;
}
