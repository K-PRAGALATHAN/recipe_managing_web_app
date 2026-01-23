import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, CopyPlus, CalendarDays, UtensilsCrossed } from 'lucide-react';
import { getCookMenu, getCookStatus, setCookStatus } from '../utils/cookApi';

const DEFAULT_MENU_ITEMS = [];

export default function ChefMenu() {
    // Menu State
    const [menuItems, setMenuItems] = useState(DEFAULT_MENU_ITEMS);
    const [selectedMenuIds, setSelectedMenuIds] = useState(() => new Set());
    const [doneIds, setDoneIds] = useState(() => new Set());
    const [menuDate, setMenuDate] = useState(null);
    const [menuLoading, setMenuLoading] = useState(true);
    const [menuSaving, setMenuSaving] = useState(false);
    const didHydrateRef = useRef(false);

    useEffect(() => {
        let cancelled = false;

        async function loadMenu() {
            try {
                setMenuLoading(true);
                const [menu, status] = await Promise.all([getCookMenu(), getCookStatus()]);
                if (cancelled) return;

                const items = Array.isArray(menu?.items) ? menu.items : [];
                const menuIdSet = new Set(items.map((i) => String(i.id)));

                // Reconstruct sets
                const selected = new Set(Array.isArray(status?.selectedMenuIds) ? status.selectedMenuIds.map(String) : []);
                const done = new Set(Array.isArray(status?.doneIds) ? status.doneIds.map(String) : []);

                // Filter out invalid IDs
                const normalizedSelected = new Set(Array.from(selected).filter((id) => menuIdSet.has(id)));
                const normalizedDone = new Set(Array.from(done).filter((id) => menuIdSet.has(id)));

                setMenuItems(items);
                setMenuDate(typeof status?.date === 'string' ? status.date : null);
                setSelectedMenuIds(normalizedSelected);
                setDoneIds(normalizedDone);
            } catch (err) {
                console.warn('Failed to load menu', err);
            } finally {
                if (!cancelled) setMenuLoading(false);
            }
        }

        loadMenu().catch(() => { });

        return () => {
            cancelled = true;
        };
    }, []);

    // Auto-save menu changes
    useEffect(() => {
        if (menuLoading) return;
        if (didHydrateRef.current === false) {
            didHydrateRef.current = true;
            return;
        }
        if (!menuDate) return;

        const handle = setTimeout(async () => {
            try {
                setMenuSaving(true);
                await setCookStatus({
                    date: menuDate,
                    selectedMenuIds: Array.from(selectedMenuIds),
                    doneIds: Array.from(doneIds),
                });
            } catch (err) {
                console.error('Failed to save menu', err);
            } finally {
                setMenuSaving(false);
            }
        }, 500);

        return () => clearTimeout(handle);
    }, [menuDate, selectedMenuIds, doneIds, menuLoading]);

    const toggleMenuSelection = (id) => {
        const nextId = String(id);
        setSelectedMenuIds((prev) => {
            const next = new Set(prev);
            if (next.has(nextId)) next.delete(nextId);
            else next.add(nextId);
            return next;
        });
    };

    const card = 'rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg shadow-black/20';

    return (
        <div className="p-6 lg:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-600/15 ring-1 ring-orange-500/20">
                        <UtensilsCrossed className="h-6 w-6 text-orange-400" aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-white">Daily Menu</h1>
                        <p className="text-sm text-zinc-400">Plan and manage the daily menu offerings.</p>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className={card}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    Menu Selection
                                </h2>
                                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                                    <CalendarDays size={12} />
                                    {menuDate ? menuDate : 'Today'}
                                    {menuSaving && <span className="text-orange-400 ml-2">Saving...</span>}
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-zinc-400 mb-4">Check the recipes you want to include in today's menu.</p>

                        <div className="grid gap-2">
                            {menuLoading ? (
                                <p className="text-sm text-zinc-500 py-4">Loading menu items...</p>
                            ) : menuItems.map((item) => {
                                const checked = selectedMenuIds.has(String(item.id));
                                return (
                                    <label
                                        key={item.id}
                                        className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-colors ${checked
                                                ? 'border-orange-500/30 bg-orange-500/5'
                                                : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                                            }`}
                                    >
                                        <div className="min-w-0">
                                            <p className={`truncate text-sm font-semibold ${checked ? 'text-orange-100' : 'text-zinc-300'}`}>
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-zinc-500">{item.minutes} min prep</p>
                                        </div>
                                        <div className={`grid h-6 w-6 place-items-center rounded-full border ${checked ? 'border-orange-500 bg-orange-500' : 'border-zinc-700 bg-transparent'
                                            }`}>
                                            {checked && <CheckCircle2 size={14} className="text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleMenuSelection(item.id)}
                                            className="sr-only"
                                        />
                                    </label>
                                );
                            })}
                            {!menuLoading && menuItems.length === 0 && (
                                <p className="text-sm text-zinc-500 italic">No available recipes to select found.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-blue-900/30 bg-blue-900/10 p-5">
                        <div className="flex items-start gap-3">
                            <CopyPlus className="text-blue-400 mt-1" size={20} />
                            <div>
                                <h3 className="text-sm font-bold text-blue-200">Quick Tips</h3>
                                <ul className="mt-2 space-y-2 text-xs text-blue-300">
                                    <li>• Selected items will immediately appear in the Cook Portal.</li>
                                    <li>• If you uncheck an item that is already done, progress will be saved but hidden.</li>
                                    <li>• Plan ahead based on inventory levels.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
