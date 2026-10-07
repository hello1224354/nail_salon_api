"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest, getApiErrorMessage, type Branch, type BranchList, type Service, type ServiceList } from "@/lib/api";
import { decorateService, formatServicePrice, localizeBranchName } from "@/lib/studio-data";

export function ServicesCatalogue() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [activeCategory, setActiveCategory] = useState("Tất cả");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadBranches() {
            try {
                const data = await apiRequest<BranchList>("/api/branches?page=1&limit=100");

                if (cancelled) return;

                setBranches(data.branches);
                setSelectedBranchId(data.branches[0]?.id ?? null);

                if (data.branches.length === 0) {
                    setLoading(false);
                }
            } catch (loadError) {
                if (!cancelled) {
                    setError(getApiErrorMessage(loadError, "Chưa tải được thông tin chi nhánh."));
                    setLoading(false);
                }
            }
        }

        void loadBranches();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (selectedBranchId === null) return;

        let cancelled = false;

        async function loadServices() {
            setLoading(true);
            setError("");

            try {
                const data = await apiRequest<ServiceList>(
                    `/api/services?branch_id=${selectedBranchId}&page=1&limit=100`
                );

                if (!cancelled) {
                    setServices(data.services.map(decorateService));
                    setActiveCategory("Tất cả");
                }
            } catch (loadError) {
                if (!cancelled) {
                    setServices([]);
                    setError(getApiErrorMessage(loadError, "Chưa tải được bảng giá dịch vụ."));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void loadServices();

        return () => {
            cancelled = true;
        };
    }, [selectedBranchId]);

    const categories = useMemo(() => {
        const values = Array.from(
            new Set(
                services
                    .map((service) => service.category?.trim())
                    .filter((value): value is string => Boolean(value))
            )
        );

        return ["Tất cả", ...values];
    }, [services]);

    const visibleServices = useMemo(
        () =>
            activeCategory === "Tất cả"
                ? services
                : services.filter((service) => service.category === activeCategory),
        [activeCategory, services]
    );

    const selectedBranch = branches.find((branch) => branch.id === selectedBranchId) ?? null;

    return (
        <div>
            <div className="rounded-[20px] border border-line bg-surface p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Bảng giá tại</p>
                    <p className="mt-1 font-serif text-2xl">
                        {selectedBranch ? localizeBranchName(selectedBranch.name) : "Serpente Nail Room"}
                    </p>
                    {selectedBranch ? (
                        <p className="mt-2 max-w-2xl text-xs leading-5 text-muted">{selectedBranch.address}</p>
                    ) : null}
                </div>

                <select
                    value={selectedBranchId ?? ""}
                    onChange={(event) => setSelectedBranchId(Number(event.target.value))}
                    disabled={branches.length === 0}
                    className="focus-ring mt-4 h-11 min-w-[210px] rounded-full border border-line bg-cream px-4 text-xs font-semibold outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0"
                    aria-label="Chọn chi nhánh"
                >
                    {branches.length === 0 ? <option value="">Chưa có chi nhánh</option> : null}
                    {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                            {localizeBranchName(branch.name)}
                        </option>
                    ))}
                </select>
            </div>

            {categories.length > 1 ? (
                <div className="hide-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Nhóm dịch vụ">
                    {categories.map((category) => {
                        const active = activeCategory === category;

                        return (
                            <button
                                key={category}
                                type="button"
                                onClick={() => setActiveCategory(category)}
                                aria-pressed={active}
                                className={`focus-ring shrink-0 rounded-full px-4 py-2.5 text-xs transition-colors ${
                                    active
                                        ? "bg-ink font-semibold text-white"
                                        : "border border-line bg-surface text-ink hover:border-accent/50"
                                }`}
                            >
                                {category}
                            </button>
                        );
                    })}
                </div>
            ) : null}

            {error ? (
                <div className="mt-7 rounded-[16px] border border-[#cdaea1] bg-[#f5e8e1] px-5 py-4 text-sm text-[#734738]" role="alert">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="mt-7 space-y-3" aria-label="Đang tải bảng giá">
                    {Array.from({ length: 7 }, (_, index) => (
                        <div
                            key={index}
                            className="skeleton h-[112px] rounded-[18px] border border-line"
                            style={{ animationDelay: `${index * 45}ms` }}
                        />
                    ))}
                </div>
            ) : null}

            {!loading && !error && visibleServices.length === 0 ? (
                <div className="mt-7 rounded-[18px] border border-line bg-surface px-6 py-10 text-center text-sm text-muted">
                    Chưa có dịch vụ trong mục này.
                </div>
            ) : null}

            {!loading && visibleServices.length > 0 ? (
                <div className="mt-7 overflow-hidden rounded-[22px] border border-line bg-surface">
                    {visibleServices.map((service, index) => (
                        <article
                            key={service.id}
                            className={`grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-7 ${
                                index > 0 ? "border-t border-line" : ""
                            }`}
                        >
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    {service.subcategory ? (
                                        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-accent">
                                            {service.subcategory}
                                        </span>
                                    ) : (
                                        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-accent">
                                            {service.category || "Dịch vụ"}
                                        </span>
                                    )}

                                    {!service.booking_enabled ? (
                                        <span className="rounded-full bg-cream px-2.5 py-1 text-[9px] font-semibold text-muted">
                                            Chưa mở đặt lịch online
                                        </span>
                                    ) : null}
                                </div>

                                <h2 className="mt-2 font-serif text-[24px] leading-tight tracking-[-0.02em] sm:text-[28px]">
                                    {service.display_name || service.name}
                                </h2>

                                {service.description ? (
                                    <p className="mt-2 whitespace-pre-line text-xs leading-5 text-muted">
                                        {service.description}
                                    </p>
                                ) : null}

                                {service.booking_enabled && service.duration_minutes ? (
                                    <p className="mt-2 text-[11px] text-muted">
                                        Thời lượng: {service.duration_minutes} phút
                                    </p>
                                ) : null}
                            </div>

                            <div className="sm:text-right">
                                <p className="text-lg font-semibold tabular-nums">{formatServicePrice(service)}</p>
                                {service.price_max && service.price_min && service.price_max > service.price_min ? (
                                    <p className="mt-1 text-[10px] text-muted">Giá tùy mẫu hoặc số lượng chi tiết</p>
                                ) : null}
                            </div>
                        </article>
                    ))}
                </div>
            ) : null}

            <p className="mt-5 text-xs leading-5 text-muted">
                Giá trên là bảng giá hiện có của tiệm. Những dịch vụ chưa ghi thời lượng trong dữ liệu gốc vẫn được hiển thị nhưng chưa mở đặt lịch trực tuyến.
            </p>
        </div>
    );
}
