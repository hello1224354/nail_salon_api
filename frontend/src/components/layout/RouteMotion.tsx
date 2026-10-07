"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function RouteMotion({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <div key={pathname} className="route-transition">
            {children}
        </div>
    );
}
