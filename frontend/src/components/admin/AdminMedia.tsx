"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { apiRequest, getApiErrorMessage } from "@/lib/api";

type MediaFile = {
    id: string;
    url: string;
    original_name: string;
    byte_size: number;
    mime_type: string;
    created_at: string;
};
type MediaList = {
    files: MediaFile[];
    total: number;
    total_pages: number;
};

export function MediaChooser({
    value,
    onChange,
    allowDelete = false,
}: {
    value: string;
    onChange: (next: string) => void;
    allowDelete?: boolean;
}) {
    const [page, setPage] = useState(1);
    const [list, setList] = useState<MediaList | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            setList(await apiRequest<MediaList>(`/api/media?page=${page}`));
            setError("");
        } catch (err) {
            setError(getApiErrorMessage(err, "Không tải được thư viện ảnh."));
        }
    }, [page]);

    useEffect(() => { void load(); }, [load]);

    async function uploadFile(file: File) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setError("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.");
            return;
        }
        if (!file.size || file.size > 5 * 1024 * 1024) {
            setError("Ảnh phải có dung lượng tối đa 5 MB.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            const result = await apiRequest<MediaFile>("/api/media", {
                method: "POST",
                headers: {
                    "Content-Type": file.type,
                    "X-File-Name": encodeURIComponent(file.name),
                },
                body: file,
            });
            onChange(result.url);
            setPage(1);
            setList(await apiRequest<MediaList>("/api/media?page=1"));
        } catch (err) {
            setError(getApiErrorMessage(err, "Không tải ảnh lên được."));
        } finally {
            setBusy(false);
        }
    }

    async function remove(file: MediaFile) {
        if (!window.confirm(`Xóa vĩnh viễn ảnh “${file.original_name}”? Ảnh đang sử dụng không thể xóa.`)) return;
        setBusy(true);
        setError("");
        try {
            await apiRequest(`/api/media/${file.id}`, { method: "DELETE" });
            if (value === file.url) onChange("");
            await load();
        } catch (err) {
            setError(getApiErrorMessage(err, "Không xóa được ảnh. Hãy gỡ ảnh khỏi ưu đãi/Hot Trend trước."));
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="inline-flex cursor-pointer items-center rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-white hover:bg-accent">
                    {busy ? "Đang xử lý…" : "Tải ảnh lên"}
                    <input
                        aria-label="Chọn ảnh JPEG, PNG hoặc WebP để tải lên"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={busy}
                        onChange={(event) => {
                            const file = event.currentTarget.files?.[0];
                            if (file) void uploadFile(file);
                            event.currentTarget.value = "";
                        }}
                    />
                </label>
                <span className="text-[11px] text-muted">JPEG, PNG, WebP · tối đa 5 MB</span>
            </div>

            {value ? (
                <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-cream p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={value} alt="Ảnh đang chọn" className="size-16 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold">Ảnh đã chọn</p>
                        <p className="truncate text-[10px] text-muted">{value}</p>
                    </div>
                    <button type="button" onClick={() => onChange("")} className="rounded-full border border-line px-3 py-2 text-xs">Bỏ chọn</button>
                </div>
            ) : null}
            {error ? <p role="alert" className="text-xs text-[#9d5145]">{error}</p> : null}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {list?.files.map((file) => (
                    <div key={file.id} className={`overflow-hidden rounded-xl border p-1 ${value === file.url ? "border-accent bg-tint" : "border-line"}`}>
                        <button
                            type="button"
                            aria-label={`Chọn ảnh ${file.original_name}`}
                            aria-pressed={value === file.url}
                            onClick={() => onChange(file.url)}
                            className="w-full text-left"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={file.url} alt={file.original_name} loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover" />
                            <p className="truncate px-1 py-2 text-[10px] text-muted">{file.original_name}</p>
                        </button>
                        {allowDelete ? (
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => void remove(file)}
                                className="mb-1 ml-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#9d5145] disabled:opacity-40"
                            >
                                Xóa ảnh
                            </button>
                        ) : null}
                    </div>
                ))}
            </div>

            {list && list.files.length === 0 ? <p className="text-xs text-muted">Chưa có ảnh tải lên.</p> : null}
            {list && list.total_pages > 1 ? (
                <div className="flex items-center justify-between text-xs">
                    <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Trước</button>
                    <span>Trang {page}/{list.total_pages} · {list.total} ảnh</span>
                    <button type="button" disabled={page >= list.total_pages} onClick={() => setPage((p) => p + 1)}>Tiếp →</button>
                </div>
            ) : null}
        </div>
    );
}

type Trend = {
    id: number;
    title: string | null;
    image_src: string;
    instagram_url: string;
    sort_order: number;
};

export function TrendsPanel() {
    const [trends, setTrends] = useState<Trend[]>([]);
    const [editing, setEditing] = useState<number | null>(null);
    const [title, setTitle] = useState("");
    const [image, setImage] = useState("");
    const [link, setLink] = useState("");
    const [order, setOrder] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            setTrends(await apiRequest<Trend[]>("/api/site-content/admin/trends"));
        } catch (err) {
            setError(getApiErrorMessage(err, "Không tải được danh sách Hot Trend."));
        }
    }, []);
    useEffect(() => { void load(); }, [load]);

    function edit(trend: Trend) {
        setEditing(trend.id);
        setTitle(trend.title ?? "");
        setImage(trend.image_src);
        setLink(trend.instagram_url);
        setOrder(trend.sort_order);
        setError("");
    }

    function reset() {
        setEditing(null);
        setTitle("");
        setImage("");
        setLink("");
        setOrder(trends.length + 1);
    }

    async function save(event: FormEvent) {
        event.preventDefault();
        if (!image.startsWith("/api/media/")) {
            setError("Chọn ảnh đã tải lên trong thư viện.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            await apiRequest(editing === null ? "/api/site-content/admin/trends" : `/api/site-content/admin/trends/${editing}`, {
                method: editing === null ? "POST" : "PUT",
                body: JSON.stringify({ title, image_src: image, instagram_url: link, sort_order: order }),
            });
            reset();
            await load();
        } catch (err) {
            setError(getApiErrorMessage(err, "Không lưu được Hot Trend."));
        } finally {
            setBusy(false);
        }
    }

    async function remove(id: number) {
        if (!window.confirm("Xóa mẫu Hot Trend này khỏi website? File ảnh trong thư viện sẽ được giữ lại.")) return;
        setBusy(true);
        try {
            await apiRequest(`/api/site-content/admin/trends/${id}`, { method: "DELETE" });
            if (editing === id) reset();
            await load();
        } catch (err) {
            setError(getApiErrorMessage(err, "Không xóa được Hot Trend."));
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="space-y-5">
            <div className="rounded-2xl border border-line bg-white p-5">
                <h2 className="font-serif text-2xl">Bộ sưu tập Hot Trend</h2>
                <p className="mt-1 text-xs text-muted">Sắp xếp, thêm và thay thế ảnh hiển thị trên trang chủ. Ảnh cũ vẫn hiển thị cho đến khi được thay bằng ảnh đã tải lên.</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {trends.map((trend) => (
                        <article key={trend.id} className="rounded-xl border border-line p-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={trend.image_src} alt={trend.title ?? "Mẫu Hot Trend"} className="aspect-[4/5] w-full rounded-lg object-cover" loading="lazy" />
                            <p className="mt-2 truncate text-xs">{trend.title || "Mẫu nail"}</p>
                            <div className="mt-2 flex gap-3 text-xs">
                                <button type="button" onClick={() => edit(trend)} className="font-semibold text-accent">Sửa</button>
                                <button type="button" disabled={busy} onClick={() => void remove(trend.id)} className="text-[#9d5145]">Xóa</button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>

            <form onSubmit={(event) => void save(event)} className="space-y-4 rounded-2xl border border-line bg-white p-5">
                <h3 className="font-serif text-2xl">{editing === null ? "Thêm mẫu Hot Trend" : "Chỉnh sửa mẫu Hot Trend"}</h3>
                <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs">Tên mẫu (không bắt buộc)
                        <input className="mt-1 h-10 w-full rounded-lg border border-line px-3" value={title} maxLength={255} onChange={(e) => setTitle(e.target.value)} />
                    </label>
                    <label className="text-xs">Thứ tự hiển thị
                        <input className="mt-1 h-10 w-full rounded-lg border border-line px-3" type="number" min={0} value={order} onChange={(e) => setOrder(Number(e.target.value))} />
                    </label>
                    <label className="text-xs md:col-span-2">Link bài viết Instagram
                        <input className="mt-1 h-10 w-full rounded-lg border border-line px-3" type="url" required placeholder="https://www.instagram.com/p/..." value={link} onChange={(e) => setLink(e.target.value)} />
                    </label>
                </div>
                <MediaChooser value={image} onChange={setImage} />
                {error ? <p role="alert" className="text-xs text-[#9d5145]">{error}</p> : null}
                <div className="flex gap-3">
                    <button type="submit" disabled={busy || !image} className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50">
                        {busy ? "Đang lưu…" : editing === null ? "Thêm Hot Trend" : "Lưu thay đổi"}
                    </button>
                    {editing !== null ? <button type="button" onClick={reset} className="rounded-full border border-line px-5 py-2.5 text-xs">Hủy sửa</button> : null}
                </div>
            </form>
        </section>
    );
}

export function MediaPanel() {
    const [selected, setSelected] = useState("");
    return (
        <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-serif text-2xl">Thư viện hình ảnh</h2>
            <p className="my-3 text-xs text-muted">
                File ảnh được lưu trực tiếp trong MySQL trên Railway. Ảnh đang dùng trong Ưu đãi hoặc Hot Trend không thể xóa.
            </p>
            <MediaChooser allowDelete value={selected} onChange={setSelected} />
        </section>
    );
}
