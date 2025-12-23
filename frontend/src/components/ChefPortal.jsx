import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChefHat, ClipboardCheck, FilePlus2 } from 'lucide-react';
import AddRecipeModal from './AddRecipeModal.jsx';

const STORAGE_KEY = 'chef_portal_recipes_v1';

const daysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.getTime();
};

const DEFAULT_RECIPES = [
  { id: 'r1', name: 'Grilled Salmon', status: 'Approved', updatedAt: daysAgo(0) },
  { id: 'r2', name: 'Caesar Salad', status: 'Pending', updatedAt: daysAgo(1) },
  { id: 'r3', name: 'Pasta Carbonara', status: 'Approved', updatedAt: daysAgo(2) },
  { id: 'r4', name: 'Beef Wellington', status: 'Draft', updatedAt: daysAgo(3) },
];

const startOfDay = (ts) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const formatUpdatedAt = (ts) => {
  const today = startOfDay(Date.now());
  const thatDay = startOfDay(ts);
  const diffDays = Math.round((today - thatDay) / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
};

const loadRecipes = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RECIPES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_RECIPES;
    return parsed
      .filter((r) => r && typeof r === 'object' && typeof r.id === 'string' && typeof r.name === 'string')
      .map((r) => ({
        ...r,
        status: typeof r.status === 'string' ? r.status : 'Draft',
        updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : Date.now(),
      }));
  } catch {
    return DEFAULT_RECIPES;
  }
};

const saveRecipes = (recipes) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  } catch {
    // ignore
  }
};

export default function ChefPortal() {
  const [filter, setFilter] = useState('All');
  const [recipes, setRecipes] = useState(() => loadRecipes());
  const [showAdd, setShowAdd] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    saveRecipes(recipes);
  }, [recipes]);

  const filtered = useMemo(() => {
    if (filter === 'All') return recipes;
    return recipes.filter((recipe) => recipe.status === filter);
  }, [filter, recipes]);

  const kpis = useMemo(() => {
    const total = recipes.length;
    const pending = recipes.filter((r) => r.status === 'Pending').length;
    const active = recipes.filter((r) => r.status === 'Approved').length;
    return { total, pending, active };
  }, [recipes]);

  const card = 'rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg shadow-black/20';
  const pill = (active) =>
    `px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
      active
        ? 'bg-emerald-600 border-emerald-500 text-white'
        : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-emerald-500/60'
    }`;

  return (
    <div className="p-6 lg:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600/15 ring-1 ring-emerald-500/20">
            <ChefHat className="h-6 w-6 text-emerald-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Chef Portal</h1>
            <p className="text-sm text-zinc-400">Create recipes, manage versions, approve releases.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <FilePlus2 size={16} />
            New recipe
          </button>
          <button
            type="button"
            onClick={() => setFilter('Pending')}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-semibold text-zinc-100 hover:border-emerald-500/60"
          >
            <ClipboardCheck size={16} />
            Approvals
          </button>
        </div>
      </div>

      {notice ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total recipes', value: String(kpis.total), icon: <CheckCircle2 size={18} /> },
          { label: 'Pending approvals', value: String(kpis.pending), icon: <ClipboardCheck size={18} /> },
          { label: 'Active versions', value: String(kpis.active), icon: <ChefHat size={18} /> },
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

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {['All', 'Approved', 'Pending', 'Draft'].map((value) => (
          <button key={value} type="button" className={pill(filter === value)} onClick={() => setFilter(value)}>
            {value}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        {filtered.map((recipe) => (
          <div
            key={recipe.id}
            className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{recipe.name}</p>
              <p className="mt-1 text-xs text-zinc-500">Updated {formatUpdatedAt(recipe.updatedAt)}</p>
            </div>
            <span
              className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
                recipe.status === 'Approved'
                  ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20'
                  : recipe.status === 'Pending'
                    ? 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20'
                    : 'bg-zinc-500/10 text-zinc-200 ring-1 ring-zinc-500/20'
              }`}
            >
              {recipe.status}
            </span>
          </div>
        ))}
      </div>

      <AddRecipeModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreate={(payload) => {
          const id = globalThis.crypto?.randomUUID?.() ?? `r_${Date.now()}_${Math.random().toString(16).slice(2)}`;
          setRecipes((prev) => [{ id, updatedAt: Date.now(), ...payload }, ...prev]);
          setFilter('All');
          setNotice(`Recipe “${payload.name}” created.`);
          window.setTimeout(() => setNotice(null), 2500);
        }}
      />
    </div>
  );
}
