"use client";

import React, { useState } from "react";

export function ProjectedReturns({ rate = 0.1 }: { rate?: number }) {
    const [principal, setPrincipal] = useState<string>("100");

    const parsePrincipal = (v: string) => {
        const n = Number(v);
        return isNaN(n) || n < 0 ? 0 : n;
    };

    const principalNum = parsePrincipal(principal);
    const projected = principalNum * (1 + rate);

    return (
        <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div className=" text-gray-900 text-2xl font-semibold mb-4">
                <h2>Projected Returns</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                    <div className="text-sm text-slate-500">Principal (APT)</div>
                    <input
                        value={principal}
                        onChange={(e) => setPrincipal(e.target.value)}
                        className="mt-2 w-full rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 text-gray-900"
                    />
                </div>

                <div>
                    <div className="text-sm text-slate-500">Projected Payout</div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-white mt-2">{projected.toLocaleString(undefined, { maximumFractionDigits: 4 })} APT</div>
                </div>
            </div>
        </div>
    );
}
