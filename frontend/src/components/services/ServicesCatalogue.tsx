"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { apiRequest, getApiErrorMessage, type Branch, type BranchList, type ServiceList } from "@/lib/api";
import {
    decorateService,
    formatVnd,
    localizeBranchName,
    type ServiceCategory,
    type StudioService,
} from "@/lib/studio-data";

type Filter = "Tất cả" | ServiceCategory;

const filters: Filter[] = ["Tất cả", "Tay", "Chân", "Nghệ thuật & chăm sóc"];

export function ServicesCatalogue() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
    const [services, setServices] = useState<StudioService[]>([]);
    const [activeFilter, setActiveFilter] = useState<Filter>("Tất cả");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadBranches() {
            try {
                const data = await apiRequest<BranchList>("/api/branches?page=1&limit=100");
                if (cancelled) return;

                setBranches(data.branches);
                setSelectedBranchId((current) => current ?? data.branches[0]?.id ?? null);
                if (data.branches.length === 0) setLoading(false);
            } catch (loadError) {
                if (!cancelled) {
                    setError(getApiErrorMessage(loadError, "Không thể tải danh sách chi nhánh."));
                    setLoading(false);
                }
            }
        }

        loadBranches();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (selectedBranchId === null) {
            return;
        }

        let cancelled = false;

        async function loadServices() {
            try {
                const data = await apiRequest<ServiceList>(
                    `/api/services?branch_id=${selectedBranchId}&page=1&limit=100`
                );

                if (!cancelled) {
                    setServices(data.services.map(decorateService));
                }
            } catch (loadError) {
                if (!cancelled) {
                    setServices([]);
                    setError(getApiErrorMessage(loadError, "Không thể tải danh sách dịch vụ."));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadServices();

        return () => {
            cancelled = true;
        };
    }, [selectedBranchId]);

    const handleBranchChange = (branchId: number) => {
        if (branchId === selectedBranchId) return;

        setSelectedBranchId(branchId);
        setServices([]);
        setActiveFilter("Tất cả");
        setError("");
        setLoading(true);
    };

    const visibleServices = useMemo(
        () =>
            activeFilter === "Tất cả"
                ? services
                : services.filter((service) => service.category === activeFilter),
        [activeFilter, services]
    );

    return (
        <>
            <div className="mb-6 flex flex-col gap-3 rounded-[18px] border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Chi nhánh đã chọn</p>
                    <p className="mt-1 text-xs text-muted">Dịch vụ và giá được cập nhật theo chi nhánh đang hoạt động.</p>
                </div>
                <select
                    value={selectedBranchId ?? ""}
                    onChange={(event) => handleBranchChange(Number(event.target.value))}
                    disabled={branches.length === 0}
                    className="focus-ring h-10 rounded-full border border-line bg-cream px-4 text-xs font-semibold outline-none disabled:cursor-not-allowed disabled:opacity-50"
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

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc dịch vụ">
                    {filters.map((filter) => {
                        const active = activeFilter === filter;

                        return (
                            <button
                                key={filter}
                                type="button"
                                onClick={() => setActiveFilter(filter)}
                                aria-pressed={active}
                                className={`focus-ring rounded-full px-5 py-2.5 text-xs transition-colors ${
                                    active
                                        ? "bg-ink font-semibold text-white"
                                        : "border border-line bg-surface text-ink hover:border-accent/45"
                                }`}
                            >
                                {filter}
                            </button>
                        );
                    })}
                </div>
                <p className="text-xs text-muted">Giá hiển thị bằng VND</p>
            </div>

            {error ? (
                <div className="mt-7 rounded-[16px] border border-[#cdaea1] bg-[#f5e8e1] px-5 py-4 text-sm text-[#734738]" role="alert">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6" aria-label="Đang tải dịch vụ">
                    {Array.from({ length: 6 }, (_, index) => (
                        <div key={index} className="h-[430px] animate-pulse rounded-[20px] border border-line bg-surface" />
                    ))}
                </div>
            ) : null}

            {!loading && !error && visibleServices.length === 0 ? (
                <div className="mt-7 rounded-[16px] border border-line bg-surface px-5 py-8 text-center text-sm text-muted">
                    Chi nhánh này hiện chưa có dịch vụ đang hoạt động.
                </div>
            ) : null}

            {!loading && visibleServices.length > 0 ? (
                <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
                    {visibleServices.map((service) => (
                        <article
                            key={service.id}
                            className="overflow-hidden rounded-[20px] border border-line bg-surface p-2 shadow-[0_10px_30px_rgba(48,40,35,0.035)]"
                        >
                            <div className="relative aspect-square overflow-hidden rounded-[15px] bg-tint">
                                <Image
                                    src={service.image}
                                    alt={service.name}
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    className="object-cover"
                                />
                            </div>

                            <div className="px-4 pb-4 pt-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                                    {service.category}
                                </p>
                                <h2 className="mt-2 font-serif text-[28px] leading-tight tracking-[-0.02em]">
                                    {service.name}
                                </h2>
                                <p className="mt-2 min-h-10 text-xs leading-5 text-muted">
                                    {service.description}
                                </p>
                                <div className="mt-5 flex items-end justify-between border-t border-line pt-4">
                                    <span className="text-xs text-muted">{service.duration_minutes} phút</span>
                                    <span className="text-lg font-semibold tabular-nums">{formatVnd(service.price)}</span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            ) : null}
        </>
    );
}
