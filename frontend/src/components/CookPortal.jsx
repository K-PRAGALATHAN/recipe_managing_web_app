import React, { useMemo, useState } from 'react';
import { CheckCircle2, ListTodo, UtensilsCrossed } from 'lucide-react';

const TODAY_MENU = [
  { id: 'm1', name: 'Grilled Salmon', minutes: 25 },
  { id: 'm2', name: 'Caesar Salad', minutes: 15 },
  { id: 'm3', name: 'Pasta Carbonara', minutes: 30 },
  { id: 'm4', name: 'Beef Wellington', minutes: 45 },
];

export default function CookPortal() {
  const [selectedMenuIds, setSelectedMenuIds] = useState(() => new Set(['m1', 'm2']));
  const [doneIds, setDoneIds] = useState(() => new Set(['m2']));

  const selectedMenu = useMemo(
    () => TODAY_MENU.filter((item) => selectedMenuIds.has(item.id)),
    [selectedMenuIds]
  );

  const toggleSelected = (id) => {
    setSelectedMenuIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleDone = (id) => {
    setDoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const completedCount = selectedMenu.filter((item) => doneIds.has(item.id)).length;

  const card = 'rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg shadow-black/20';

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-600/15 ring-1 ring-orange-500/20">
          <UtensilsCrossed className="h-6 w-6 text-orange-400" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Cook Portal</h1>
          <p className="text-sm text-zinc-400">Select today’s menu and track execution.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { label: "Today's menu items", value: String(selectedMenu.length), icon: <ListTodo size={18} /> },
          { label: 'Completed', value: String(completedCount), icon: <CheckCircle2 size={18} /> },
          {
            label: 'Progress',
            value: selectedMenu.length ? `${Math.round((completedCount / selectedMenu.length) * 100)}%` : '0%',
            icon: <UtensilsCrossed size={18} />,
          },
        ].map((kpi) => (
          <div key={kpi.label} className={card}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{kpi.label}</p>
              <span className="text-zinc-500">{kpi.icon}</span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <p className="text-sm font-bold text-white">Select menu for today</p>
          <p className="mt-1 text-xs text-zinc-500">Choose which recipes you’re preparing.</p>

          <div className="mt-4 grid gap-2">
            {TODAY_MENU.map((item) => {
              const checked = selectedMenuIds.has(item.id);
              return (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 hover:border-orange-500/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-zinc-500">{item.minutes} min</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelected(item.id)}
                    className="h-4 w-4 rounded border-zinc-700 text-orange-500 focus:ring-orange-400"
                  />
                </label>
              );
            })}
          </div>
        </div>

        <div className={card}>
          <p className="text-sm font-bold text-white">Execution checklist</p>
          <p className="mt-1 text-xs text-zinc-500">Mark items as you complete them.</p>

          <div className="mt-4 grid gap-2">
            {selectedMenu.length ? (
              selectedMenu.map((item) => {
                const done = doneIds.has(item.id);
                return (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border bg-zinc-950 px-4 py-3 ${
                      done ? 'border-emerald-500/30' : 'border-zinc-800 hover:border-orange-500/40'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-semibold ${done ? 'text-emerald-200 line-through' : 'text-white'}`}>
                        {item.name}
                      </p>
                      <p className="text-xs text-zinc-500">{item.minutes} min</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => toggleDone(item.id)}
                      className="h-4 w-4 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-400"
                    />
                  </label>
                );
              })
            ) : (
              <p className="text-sm text-zinc-400">Select at least one menu item to start.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

