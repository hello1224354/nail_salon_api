"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiRequest, getApiErrorMessage, type Branch, type BranchList } from "@/lib/api";

const STORAGE_KEY = "serpente:selected-branch-id";

type BranchContextValue = {
    branches: Branch[];
    selectedBranchId: number | null;
    selectedBranch: Branch | null;
    loading: boolean;
    error: string;
    setSelectedBranchId: (branchId: number) => void;
};

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: { children: ReactNode }) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranchId, setSelectedBranchIdState] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadBranches() {
            try {
                const data = await apiRequest<BranchList>("/api/branches?page=1&limit=100");

                if (cancelled) return;

                setBranches(data.branches);

                const storedId = Number(window.localStorage.getItem(STORAGE_KEY));
                const storedBranch = data.branches.find((branch) => branch.id === storedId);
                const initialBranchId = storedBranch?.id ?? data.branches[0]?.id ?? null;

                setSelectedBranchIdState(initialBranchId);

                if (initialBranchId !== null) {
                    window.localStorage.setItem(STORAGE_KEY, String(initialBranchId));
                }
            } catch (loadError) {
                if (!cancelled) {
                    setError(getApiErrorMessage(loadError, "Chưa tải được danh sách chi nhánh."));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void loadBranches();

        return () => {
            cancelled = true;
        };
    }, []);

    const setSelectedBranchId = (branchId: number) => {
        if (!branches.some((branch) => branch.id === branchId)) return;

        setSelectedBranchIdState(branchId);
        window.localStorage.setItem(STORAGE_KEY, String(branchId));
    };

    const selectedBranch = useMemo(
        () => branches.find((branch) => branch.id === selectedBranchId) ?? null,
        [branches, selectedBranchId]
    );

    return (
        <BranchContext.Provider
            value={{
                branches,
                selectedBranchId,
                selectedBranch,
                loading,
                error,
                setSelectedBranchId,
            }}
        >
            {children}
        </BranchContext.Provider>
    );
}

export function useBranch() {
    const context = useContext(BranchContext);

    if (!context) {
        throw new Error("useBranch must be used within BranchProvider");
    }

    return context;
}
